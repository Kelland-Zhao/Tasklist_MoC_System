import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { extractScript } from './strategy-test-utils.mjs';

const src = extractScript(fs.readFileSync('Version_History_JS.html', 'utf8'));
const api = new Function(
  `${src}; return { versionHistoryEscape_, versionHistoryStatusBadge_, machineVersionRows_, versionHistoryParseOperator_, versionHistoryTableHtml_ };`
)();

test('按机型筛选历史行并按新到旧返回', () => {
  const rows = [
    { MachineType: '6AX', Status: '生效/ Effective', Operator: 'old' },
    { MachineType: 'FCS', Status: '生效/ Effective', Operator: 'other' },
    { MachineType: ' 6AX ', Status: '取代/ Replace', Operator: 'replaced' },
    { MachineType: '6AX', Status: '待审批/ Pending', Operator: 'pending' },
    { MachineType: '6AX', Status: '状态/ Status', Operator: 'header' },
  ];

  const versions = api.machineVersionRows_(rows, '6AX');

  assert.equal(versions.length, 3);
  assert.equal(versions[0].Operator, 'pending');
  assert.equal(versions[1].Operator, 'replaced');
  assert.equal(versions[2].Operator, 'old');
});

test('机型为空或历史为空时返回空数组', () => {
  assert.deepEqual(api.machineVersionRows_([], '6AX'), []);
  assert.deepEqual(api.machineVersionRows_(null, '6AX'), []);
  assert.deepEqual(api.machineVersionRows_([{ MachineType: '6AX', Status: '生效/ Effective' }], ''), []);
});

test('解析申请人姓名和提交时间', () => {
  const parsed = api.versionHistoryParseOperator_(
    '工号/ JobNumber: 10001_姓名/ Name: 张三 2026-11-13 10:00:00'
  );
  assert.equal(parsed.jobNumber, '10001');
  assert.equal(parsed.name, '张三');
  assert.equal(parsed.timestamp, '2026-11-13 10:00:00');
});

test('状态徽章映射颜色', () => {
  assert.ok(api.versionHistoryStatusBadge_('生效/ Effective').includes('bg-success'));
  assert.ok(api.versionHistoryStatusBadge_('取代/ Replace').includes('bg-secondary'));
  assert.ok(api.versionHistoryStatusBadge_('作废/ Void').includes('bg-dark'));
  assert.ok(api.versionHistoryStatusBadge_('拒绝/ Rejected').includes('bg-danger'));
  assert.ok(api.versionHistoryStatusBadge_('待发放/ Wait for Dissminater').includes('bg-warning'));
});

test('版本任务清单表格转义单元格并保留左对齐列', () => {
  const headers = [
    { cn: '机型', en: 'Machine Type' },
    { cn: '任务描述', en: 'Task Description', align: 'left' },
  ];
  const html = api.versionHistoryTableHtml_(
    headers,
    [{ MachineType: '<b>6AX</b>', 'Task Description': 'A & B' }],
    ['MachineType', 'Task Description']
  );

  assert.ok(html.includes('机型<br><small>Machine Type</small>'));
  assert.ok(html.includes('&lt;b&gt;6AX&lt;/b&gt;'));
  assert.ok(html.includes('A &amp; B'));
  assert.ok(html.includes('class="version-history-left"'));
  assert.ok(!html.includes('<b>6AX</b>'));
});

test('版本任务清单为空时显示占位', () => {
  const html = api.versionHistoryTableHtml_([{ cn: '机型', en: 'Machine Type' }], [], ['MachineType']);
  assert.ok(html.includes('colspan="1"'));
});

test('两个查阅页接入版本历史', () => {
  const pages = [
    ['Tasklist_Viewer.html', 'Tasklist_Viewer_JS.html'],
    ['Inspection_Viewer.html', 'Inspection_Viewer_JS.html'],
  ];
  pages.forEach(([htmlFile, jsFile]) => {
    const html = fs.readFileSync(htmlFile, 'utf8');
    const js = fs.readFileSync(jsFile, 'utf8');
    assert.ok(html.includes('include("Version_History_JS")'), htmlFile);
    assert.ok(html.includes('操作<br><small>Action</small>'), htmlFile);
    assert.ok(js.includes('btn-version-history'), jsFile);
    assert.ok(js.includes('showTasklistVersionHistory_'), jsFile);
    assert.ok(js.includes('versionHistoryTableHtml_'), jsFile);
  });
});
