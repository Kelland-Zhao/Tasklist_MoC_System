import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { extractScript } from './strategy-test-utils.mjs';

const src = extractScript(fs.readFileSync('Validation_JS.html', 'utf8'));
const api = new Function(
  `${src}; return { tasklistMissingFields_, tasklistMissingFieldsHtml_ };`
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
