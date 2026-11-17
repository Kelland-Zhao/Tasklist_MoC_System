import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { extractScript } from './strategy-test-utils.mjs';

function loadPdM() {
  assert.ok(fs.existsSync('Tasklist_PdM_JS.html'), '缺少公共 PdM 显示模块');
  return new Function(extractScript(fs.readFileSync('Tasklist_PdM_JS.html', 'utf8')) +
    '; return { tasklistIsPdM_, tasklistPdMRowClass_, tasklistPdMCellClass_, tasklistPdMRow_, tasklistPdMStyles_, tasklistPdMPrintOptions_ };')();
}

function loadRenderer(file, name) {
  return new Function(extractScript(fs.readFileSync(file, 'utf8')) + '; return ' + name + ';')();
}

const headers = [{ cn: '机型' }, { cn: '任务编号' }, { cn: '任务描述', align: 'left' }];
const keys = ['MachineType', 'Task No', 'Task Description'];
const tasks = [
  { MachineType: 'HIM', 'Task No': 'HIM-01', 'Task Description': '<检查> & 记录', 'PdM?': '是/ Yes' },
  { MachineType: 'HIM', 'Task No': 'HIM-02 - PdM', 'Task Description': '普通任务', 'PdM?': '否/ No' },
];

test('PdM 高亮以标记为准，兼容既有肯定值，不从其他字段猜测', () => {
  const api = loadPdM();
  for (const value of ['是/ Yes', ' 是/ Yes ', '是', 'Yes']) {
    assert.equal(api.tasklistIsPdM_({ 'PdM?': value }), true, value);
  }
  for (const value of ['否/ No', '', null, undefined]) {
    assert.equal(api.tasklistIsPdM_({ 'PdM?': value, 'Task No': 'HIM-01 - PdM', Strategy: '预测性/ Predictive', 'Task Type': 'PdM' }), false);
  }
  assert.equal(api.tasklistIsPdM_(null), false);
});

test('PdM 类名只标记任务行和任务编号列', () => {
  const api = loadPdM();
  assert.equal(api.tasklistPdMRowClass_(tasks[0]), 'tasklist-pdm-row');
  assert.equal(api.tasklistPdMRowClass_(tasks[1]), '');
  assert.equal(api.tasklistPdMCellClass_(tasks[0], 'Task No'), 'tasklist-pdm-task-no');
  assert.equal(api.tasklistPdMCellClass_(tasks[0], 'Task Type'), '');
  assert.equal(api.tasklistPdMCellClass_(tasks[1], 'Task No'), '');
});

test('重绘同一行时清除旧 PdM 标记，保留新增行和校验标记，不污染保存数据', () => {
  const api = loadPdM();
  function element(initial) {
    const classes = new Set(initial || []);
    const attributes = new Map();
    return {
      classList: { toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); }, contains(name) { return classes.has(name); } },
      setAttribute(name, value) { attributes.set(name, value); },
      removeAttribute(name) { attributes.delete(name); },
      getAttribute(name) { return attributes.get(name); },
    };
  }
  const row = element(['new-row']);
  row.cells = [element(), element(['cell-invalid'])];
  const task = Object.freeze({ 'Task No': 'HIM-01', 'PdM?': '是/ Yes' });
  api.tasklistPdMRow_(row, task);
  assert.equal(row.classList.contains('tasklist-pdm-row'), true);
  assert.equal(row.cells[1].classList.contains('tasklist-pdm-task-no'), true);
  assert.match(row.cells[1].getAttribute('aria-label'), /HIM-01.*PdM/);
  api.tasklistPdMRow_(row, { 'Task No': 'HIM-02', 'PdM?': '否/ No' });
  assert.equal(row.classList.contains('tasklist-pdm-row'), false);
  assert.equal(row.cells[1].classList.contains('tasklist-pdm-task-no'), false);
  assert.equal(row.cells[1].getAttribute('aria-label'), undefined);
  assert.equal(row.classList.contains('new-row'), true);
  assert.equal(row.cells[1].classList.contains('cell-invalid'), true);
  assert.deepEqual(task, { 'Task No': 'HIM-01', 'PdM?': '是/ Yes' });
});

test('打印按完整任务标记高亮，不依赖导出列或编号后缀，并保留内容转义', () => {
  const api = loadPdM();
  const buildPrintHtml = loadRenderer('Print_Export_JS.html', 'buildPrintHtml');
  const html = buildPrintHtml({
    headers, rows: tasks.map(task => keys.map(key => task[key])),
    ...api.tasklistPdMPrintOptions_(tasks, keys),
  });
  assert.match(html, /<tr class="tasklist-pdm-row"><td>HIM<\/td><td class="tasklist-pdm-task-no">HIM-01<\/td>/);
  assert.match(html, /<tr><td>HIM<\/td><td>HIM-02 - PdM<\/td>/);
  assert.ok(html.includes('&lt;检查&gt; &amp; 记录'));
  assert.ok(!html.includes('<检查>'));
  assert.ok(html.includes('content: "PdM"'));
  assert.ok(html.includes('#f3eafb'));
  assert.ok(html.includes('print-color-adjust: exact'));
});

test('打印任务编号列改变位置后，标签仍跟随字段名', () => {
  const api = loadPdM();
  const buildPrintHtml = loadRenderer('Print_Export_JS.html', 'buildPrintHtml');
  const reordered = ['Task No', 'Task Description'];
  const html = buildPrintHtml({
    headers: [{ cn: '编号' }, { cn: '描述' }],
    rows: [reordered.map(key => tasks[0][key])],
    ...api.tasklistPdMPrintOptions_([tasks[0]], reordered),
  });
  assert.match(html, /<tr class="tasklist-pdm-row"><td class="tasklist-pdm-task-no">HIM-01<\/td><td>/);
});

test('历史版本按各版本自身 PdM 标记显示，标签不写入任务内容', () => {
  const api = loadPdM();
  const renderHistory = loadRenderer('Version_History_JS.html', 'versionHistoryTableHtml_');
  const before = JSON.stringify(tasks);
  const html = renderHistory(headers, tasks, keys, {
    rowClass: api.tasklistPdMRowClass_, cellClass: api.tasklistPdMCellClass_,
  });
  assert.match(html, /<tr class="tasklist-pdm-row"><td>HIM<\/td><td class="tasklist-pdm-task-no">HIM-01<\/td>/);
  assert.match(html, /<tr><td>HIM<\/td><td>HIM-02 - PdM<\/td>/);
  assert.ok(html.includes('&lt;检查&gt; &amp; 记录'));
  assert.equal(JSON.stringify(tasks), before);
});

test('共享打印和历史渲染默认保持点检及其他模块原样', () => {
  const buildPrintHtml = loadRenderer('Print_Export_JS.html', 'buildPrintHtml');
  const renderHistory = loadRenderer('Version_History_JS.html', 'versionHistoryTableHtml_');
  const print = buildPrintHtml({ headers, rows: [['INJ', 'PdM', 'A & B']] });
  const history = renderHistory(headers, tasks, keys);
  assert.match(print, /<tbody><tr><td>INJ<\/td><td>PdM<\/td>/);
  assert.ok(!print.includes('class="tasklist-pdm'));
  assert.ok(!history.includes('class="tasklist-pdm'));
});

test('可选打印和历史类名必须转义，不允许注入属性', () => {
  const buildPrintHtml = loadRenderer('Print_Export_JS.html', 'buildPrintHtml');
  const renderHistory = loadRenderer('Version_History_JS.html', 'versionHistoryTableHtml_');
  const options = { rowClass: () => 'x" onclick="bad', cellClass: () => 'y" onmouseover="bad' };
  for (const html of [
    buildPrintHtml({ headers, rows: [['HIM', '01', '描述']], ...options }),
    renderHistory(headers, tasks, keys, options),
  ]) {
    assert.ok(html.includes('class="x&quot; onclick=&quot;bad"'));
    assert.ok(html.includes('class="y&quot; onmouseover=&quot;bad'));
    assert.ok(!html.includes(' onclick="bad'));
  }
});

test('各保养任务页在功能逻辑前加载 PdM 模块，点检和策略保持独立', () => {
  for (const page of ['Tasklist_Create', 'Tasklist_MoC_Modify', 'Tasklist_void', 'Tasklist_Production_Approval', 'Tasklist_Approval1', 'Tasklist_Approval2', 'Tasklist_Dissminater', 'Tasklist_Viewer', 'Tasklist_Progress']) {
    const html = fs.readFileSync(page + '.html', 'utf8');
    const include = html.indexOf('include("Tasklist_PdM_JS")');
    assert.ok(include >= 0 && include < html.indexOf('include("' + page + '_JS")'), page);
    const script = extractScript(fs.readFileSync(page + '_JS.html', 'utf8'));
    assert.doesNotThrow(() => new Function(script), page);
    assert.match(script, /(?:rowCallback:\s*tasklistPdMRow_|tasklistPdMRow_\(rowEl, data\))/, page);
  }
  for (const page of ['Inspection_Viewer', 'Strategy_Viewer']) {
    assert.ok(!fs.readFileSync(page + '.html', 'utf8').includes('include("Tasklist_PdM_JS")'), page);
  }
});
