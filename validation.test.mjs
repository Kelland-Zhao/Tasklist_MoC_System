import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { extractScript } from './strategy-test-utils.mjs';

const src = extractScript(fs.readFileSync('Validation_JS.html', 'utf8'));
const api = new Function(
  `${src}; return { tasklistMissingFields_, tasklistMissingFieldsHtml_, tasklistFillMeasurementDefaults_ };`
)();

test('找出空值和「请选择」占位的行', () => {
  const rows = [
    { 'Task No': '6AX-01', 'Line Status': '运行', Strategy: 'RBM', Resource: '技术员/ Technician' },
    { 'Task No': '6AX-02', 'Line Status': '', Strategy: '请选择/ Please select', Resource: '  ' },
    { 'Task No': '6AX-03', 'Line Status': '停机', Strategy: 'TBM', Resource: '' },
  ];
  const missing = api.tasklistMissingFields_(rows, ['Line Status', 'Strategy', 'Resource']);
  assert.equal(missing.length, 2);
  assert.equal(missing[0].index, 2);
  assert.equal(missing[0].taskNo, '6AX-02');
  assert.deepEqual(missing[0].missing, ['Line Status', 'Strategy', 'Resource']);
  assert.deepEqual(missing[1].missing, ['Resource']);
});

test('全部填写时不返回缺失行', () => {
  const rows = [{ 'Task No': '6AX-01', 'Line Status': '运行', Strategy: 'RBM', Resource: '操作员/ OPC' }];
  assert.deepEqual(api.tasklistMissingFields_(rows, ['Line Status', 'Strategy', 'Resource']), []);
});

test('「请输入」也视为未填写', () => {
  const rows = [{ 'Task No': 'INJ-01', Status: '请输入', Frequency: '周检', Resource: '请输入' }];
  const missing = api.tasklistMissingFields_(rows, ['Status', 'Frequency', 'Resource']);
  assert.equal(missing.length, 1);
  assert.deepEqual(missing[0].missing, ['Status', 'Resource']);
});

test('提示 HTML 列出前 5 行并转义', () => {
  const rows = Array.from({ length: 7 }, (_, i) => ({
    'Task No': 'T<' + i + '>',
    'Line Status': '',
    Strategy: 'RBM',
    Resource: '技术员/ Technician',
  }));
  const missing = api.tasklistMissingFields_(rows, ['Line Status', 'Strategy', 'Resource']);
  const html = api.tasklistMissingFieldsHtml_(missing, { 'Line Status': '设备状态 / Line Status' });
  assert.ok(html.includes('设备状态 / Line Status'));
  assert.ok(html.includes('另有 2 行'));
  assert.ok(html.includes('T&lt;0&gt;'));
  assert.ok(!html.includes('T<0>'));
});

test('四个入口都接入必填校验', () => {
  const pages = [
    ['Tasklist_MoC_Modify.html', 'Tasklist_MoC_Modify_JS.html', 'btn'],
    ['Tasklist_Create.html', 'Tasklist_Create_JS.html', 'btn'],
    ['Inspection_Edit.html', 'Inspection_Edit_JS.html', 'btn'],
    ['Inspection_Create.html', 'Inspection_Create_JS.html', 'btn'],
  ];
  pages.forEach(([htmlFile, jsFile]) => {
    const html = fs.readFileSync(htmlFile, 'utf8');
    const js = fs.readFileSync(jsFile, 'utf8');
    assert.ok(html.includes('include("Validation_JS")'), htmlFile);
    assert.ok(js.includes('tasklistMissingFields_('), jsFile);
    assert.ok(js.includes('tasklistMissingFieldsHtml_('), jsFile);
  });
});

test('预测性=否 时 PdM 字段为空不拦截', () => {
  const rows = [{
    'Task No': 'T1', 'Line Status': '运行', Strategy: 'RBM', Resource: '技术员/ Technician',
    'PdM?': '否/ No', Unit: '', Component: '', Logic: '', TagName: '', 'LL Limited': '', 'HH Limited': '',
  }];
  assert.deepEqual(
    api.tasklistMissingFields_(rows, ['Line Status', 'Strategy', 'Resource'], {
      field: 'PdM?',
      fields: ['Unit', 'Component', 'Logic', 'TagName', 'LL Limited', 'HH Limited'],
    }),
    []
  );
});

test('预测性=是 时 PdM 字段为空拦截，填齐则通过', () => {
  const rows = [
    { 'Task No': 'T1', 'Line Status': '运行', Strategy: 'RBM', Resource: '技术员/ Technician', 'PdM?': '是/ Yes', Unit: '', Component: '', Logic: '', TagName: '', 'LL Limited': '', 'HH Limited': '' },
    { 'Task No': 'T2', 'Line Status': '运行', Strategy: 'RBM', Resource: '技术员/ Technician', 'PdM?': '是', Unit: 'mm', Component: 'A', Logic: 'HighAlarm_Max', TagName: 'TAG1', 'LL Limited': '0', 'HH Limited': '10' },
  ];
  const missing = api.tasklistMissingFields_(rows, ['Line Status', 'Strategy', 'Resource'], {
    field: 'PdM?',
    fields: ['Unit', 'Component', 'Logic', 'TagName', 'LL Limited', 'HH Limited'],
  });
  assert.equal(missing.length, 1);
  assert.equal(missing[0].taskNo, 'T1');
  assert.deepEqual(missing[0].missing, ['Unit', 'Component', 'Logic', 'TagName', 'LL Limited', 'HH Limited']);
});

test('PdM 必填字段不含 LL/HH（允许为空）', () => {
  const rows = [{
    'Task No': 'FCS-43', 'Line Status': '运行', Strategy: 'RBM', Resource: '技术员/ Technician',
    'PdM?': '是/ Yes', Unit: '哥林柱', Component: '锁模机构', Logic: 'HighAlarm_Max', TagName: 'S1-S4',
    'LL Limited': '', 'HH Limited': '',
  }];
  assert.deepEqual(
    api.tasklistMissingFields_(rows, ['Line Status', 'Strategy', 'Resource'], {
      field: 'PdM?',
      fields: ['Unit', 'Component', 'Logic', 'TagName'],
    }),
    []
  );
});

test('两页 PdM 必填字段不包含 LL/HH', () => {
  for (const jsFile of ['Tasklist_MoC_Modify_JS.html', 'Tasklist_Create_JS.html']) {
    const js = fs.readFileSync(jsFile, 'utf8');
    assert.ok(!js.includes("'LL Limited', 'HH Limited']"), jsFile);
  }
});

test('旧清单行补齐测量字段默认值', () => {
  const row = { 'Task No': 'FCS-43', MachineType: '6AX' };
  api.tasklistFillMeasurementDefaults_(row);
  assert.equal(row['Photo Required'], 'N');
  assert.equal(row['Measurement Points'], '');
  assert.equal(row['Point Labels'], '');
  assert.equal(row['Measurement Unit'], '');
  assert.equal(row['PdM?'], '否/ No');
  assert.equal(row['Task No'], 'FCS-43');
});

test('已有字段不被覆盖', () => {
  const row = { 'PdM?': '是/ Yes', 'Measurement Points': 'S1', 'Photo Required': 'Y' };
  api.tasklistFillMeasurementDefaults_(row);
  assert.equal(row['PdM?'], '是/ Yes');
  assert.equal(row['Measurement Points'], 'S1');
  assert.equal(row['Photo Required'], 'Y');
});

test('修改页加载时补齐新字段再渲染表格', () => {
  const js = fs.readFileSync('Tasklist_MoC_Modify_JS.html', 'utf8');
  const fillIdx = js.indexOf('tasklistFillMeasurementDefaults_(row)');
  const addIdx = js.indexOf('table.rows.add(Tasklist[0]).draw()');
  assert.ok(fillIdx >= 0, 'modify page must call normalizer');
  assert.ok(addIdx > fillIdx, 'normalizer must run before rows.add');
});
