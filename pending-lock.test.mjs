import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { extractScript } from './strategy-test-utils.mjs';

const src = extractScript(fs.readFileSync('Pending_Lock_JS.html', 'utf8'));
const api = new Function(
  `${src}; return { TASKLIST_PENDING_STATUSES, STRATEGY_PENDING_STATUSES, tasklistHasPendingForMachine_, strategyHasPendingNew_ };`
)();

const NEW_CONTENT = {
  strategyId: '',
  version: '00',
  new: {
    工序: 'IM',
    'Machine Type': 'FCS',
    'PM Description': '季度保养',
  },
};

test('清单：三种在途状态都拦截', () => {
  ['待审批/ Pending', '待发放/ Wait for Dissminater', '作废待审批/ Void Pending'].forEach((status) => {
    const rows = [{ MachineType: '6AX', Status: status }];
    assert.equal(api.tasklistHasPendingForMachine_(rows, '6AX'), true, status);
  });
});

test('清单：非在途状态、其他机型、空值不拦截', () => {
  assert.equal(api.tasklistHasPendingForMachine_([{ MachineType: '6AX', Status: '生效/ Effective' }], '6AX'), false);
  assert.equal(api.tasklistHasPendingForMachine_([{ MachineType: '6AX', Status: '拒绝/ Rejected' }], '6AX'), false);
  assert.equal(api.tasklistHasPendingForMachine_([{ MachineType: 'OTHER', Status: '待审批/ Pending' }], '6AX'), false);
  assert.equal(api.tasklistHasPendingForMachine_([], '6AX'), false);
  assert.equal(api.tasklistHasPendingForMachine_(null, '6AX'), false);
  assert.equal(api.tasklistHasPendingForMachine_([{ MachineType: '6AX', Status: '待审批/ Pending' }], ''), false);
});

test('清单：机型前后空格按 trim 比较', () => {
  const rows = [{ MachineType: ' 6AX ', Status: '待审批/ Pending' }];
  assert.equal(api.tasklistHasPendingForMachine_(rows, '6AX'), true);
});

test('策略新建：同工序+机型+描述的在途新建申请拦截', () => {
  const rows = [{ Status: '待审批/ Pending', 'Strategy Content': JSON.stringify(NEW_CONTENT) }];
  assert.equal(api.strategyHasPendingNew_(rows, 'IM', 'FCS', '季度保养'), true);
  assert.equal(api.strategyHasPendingNew_(rows, 'IM', 'FCS', '年度保养'), false);
  assert.equal(api.strategyHasPendingNew_(rows, 'TF', 'FCS', '季度保养'), false);
  assert.equal(api.strategyHasPendingNew_(rows, 'IM', 'OTHER', '季度保养'), false);
});

test('策略新建：在途修改/作废或非在途状态不拦截', () => {
  const editContent = {
    strategyId: 'PM-MD-0001',
    version: '01',
    old: { ...NEW_CONTENT.new, version: '00' },
    new: NEW_CONTENT.new,
  };
  assert.equal(
    api.strategyHasPendingNew_([{ Status: '待审批/ Pending', 'Strategy Content': JSON.stringify(editContent) }], 'IM', 'FCS', '季度保养'),
    false
  );
  assert.equal(
    api.strategyHasPendingNew_([{ Status: '生效/ Effective', 'Strategy Content': JSON.stringify(NEW_CONTENT) }], 'IM', 'FCS', '季度保养'),
    false
  );
  assert.equal(
    api.strategyHasPendingNew_([{ Status: '待审批/ Pending', 'Strategy Content': 'not-json' }], 'IM', 'FCS', '季度保养'),
    false
  );
});

test('前端与后端在途状态列表一致', () => {
  const code = fs.readFileSync('Code.js', 'utf8');
  const src = code.match(/var TASKLIST_PENDING_STATUSES = \[([\s\S]*?)\];/);
  assert.ok(src);
  const backend = [...src[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(api.TASKLIST_PENDING_STATUSES, backend);
});

test('前端策略在途状态与后端 STRATEGY_STATUS 一致', () => {
  const code = fs.readFileSync('Code.js', 'utf8');
  const block = code.match(/var STRATEGY_STATUS = \{([\s\S]*?)\};/);
  assert.ok(block);
  const pick = (key) => {
    const m = block[1].match(new RegExp(key + ':\\s*"([^"]+)"'));
    assert.ok(m, key);
    return m[1];
  };
  const backend = [pick('pending'), pick('voidPending'), pick('waitRelease')];
  assert.deepEqual([...api.STRATEGY_PENDING_STATUSES].sort(), backend.sort());
});

test('清单 6 个页面接入在途校验', () => {
  const pages = [
    ['Tasklist_Create.html', 'Tasklist_Create_JS.html'],
    ['Tasklist_MoC_Modify.html', 'Tasklist_MoC_Modify_JS.html'],
    ['Tasklist_void.html', 'Tasklist_void_JS.html'],
    ['Inspection_Create.html', 'Inspection_Create_JS.html'],
    ['Inspection_Edit.html', 'Inspection_Edit_JS.html'],
    ['Inspection_Void.html', 'Inspection_Void_JS.html'],
  ];
  pages.forEach(([html, js]) => {
    assert.ok(fs.readFileSync(html, 'utf8').includes('include("Pending_Lock_JS")'), html);
    const src = fs.readFileSync(js, 'utf8');
    assert.ok(src.includes('tasklistHasPendingForMachine_'), js);
    assert.ok(src.includes("'pending_exists'"), js);
  });
});

test('策略新建页接入在途校验', () => {
  assert.ok(fs.readFileSync('Strategy_Create.html', 'utf8').includes('include("Pending_Lock_JS")'));
  assert.ok(fs.readFileSync('Strategy_Create_JS.html', 'utf8').includes('strategyHasPendingNew_'));
});
