import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode, installGas, makeSheet } from './strategy-test-utils.mjs';

const PM_DB = '1bYKTK5a63yJWRHzM_UPP6b4hwF67eZKEM5dCKLWR59U';
const IN_DB = '1RQql-PrcBWiAQNeg7hQKcocpllSUMRhT5XPrDTVWoBY';

const HISTORY_HEADER = [
  'MachineType', 'Tasklist', 'Operator', 'Reason', 'Production Approver', 'Production Comment',
  'Approver1', 'Comment1', 'Approver2', 'Comment2', 'Production Approval (Y/N)',
  'Dissminater', 'Status', 'submitMail', 'Process',
];

const WEB_HEADER = [
  'MachineType', 'Process', 'Mail_Approve1', 'Mail_Approve2', 'Mail_Disseninate', 'Mail_CC', 'Mail_Production',
];

function historyRow(machineType, status) {
  return [machineType, '[]', 'OP/ 测试 2026-11-13', '测试', '', '', '', '', '', '', 'N', '', status, 'tester@colpal.com', 'IM'];
}

function setup(dbId, machineType, historyRows) {
  const history = makeSheet([HISTORY_HEADER].concat(historyRows || []));
  const web = makeSheet([
    WEB_HEADER,
    [machineType, 'IM', 'a1@colpal.com', 'a2@colpal.com', 'doc@colpal.com', '', 'prod@colpal.com'],
  ]);
  const env = installGas({
    sheetsById: { [dbId]: { Tasklist_history: history, 'Database for Web': web } },
    sent: [],
  });
  return { history: history, env: env };
}

function pmDataSavePayload(machineType) {
  return [
    JSON.stringify([{ MachineType: machineType }]),
    '10001/ 申请人 2026-11-13',
    '测试修改',
    '待审批/ Pending',
    'tester@colpal.com',
    'IM',
    false,
  ];
}

function pmSubmitPayload(machineType) {
  return [
    {
      MachineType: machineType,
      Process: 'IM',
      Mail_Approve1: 'a1@colpal.com',
      Mail_Approve2: 'a2@colpal.com',
      Mail_Disseninate: 'doc@colpal.com',
      Mail_CC: '',
      Mail_production_Approval: 'prod@colpal.com',
      judge_Production_Approval: 'N',
    },
    [machineType, '[]', '10001/ 申请人 2026-11-13', '新建/ New', '待审批/ Pending', 'IM'],
    'IM',
  ];
}

function inDataSavePayload(machineType) {
  return [
    JSON.stringify([{ 'Machine Type': machineType }]),
    '10001/ 申请人 2026-11-13',
    '测试修改',
    '待审批/ Pending',
    'tester@colpal.com',
    'IM',
    false,
  ];
}

function inSubmitPayload(machineType) {
  return [
    {
      MachineType: machineType,
      Process: 'IM',
      Mail_Approve1: 'a1@colpal.com',
      Mail_Approve2: 'a2@colpal.com',
      Mail_Disseninate: 'doc@colpal.com',
      Mail_CC: '',
      Mail_production_Approval: 'prod@colpal.com',
      judge_Production_Approval: 'N',
    },
    [machineType, '[]', '10001/ 申请人 2026-11-13', '新建/ New', '待审批/ Pending', 'IM'],
  ];
}

const THREE_STATUSES = ['待审批/ Pending', '待发放/ Wait for Dissminater', '作废待审批/ Void Pending'];

test('保养修改/作废：三种在途状态都拒绝', () => {
  THREE_STATUSES.forEach((status) => {
    const ctx = setup(PM_DB, '6AX', [historyRow('6AX', status)]);
    const res = loadCode().dataSave.apply(null, pmDataSavePayload('6AX'));
    assert.equal(res, 'pending_exists', status);
    assert.equal(ctx.history.values.length, 2);
  });
});

test('保养修改/作废：已生效/拒绝不拦截，正常写入', () => {
  ['生效/ Effective', '拒绝/ Rejected'].forEach((status) => {
    const ctx = setup(PM_DB, '6AX', [historyRow('6AX', status)]);
    const res = loadCode().dataSave.apply(null, pmDataSavePayload('6AX'));
    assert.equal(res, true, status);
    assert.equal(ctx.history.values.length, 3);
    assert.equal(ctx.env.sent.length, 1);
  });
});

test('保养新建：同机型在途时拒绝', () => {
  const ctx = setup(PM_DB, 'NEW1', [historyRow('NEW1', '待发放/ Wait for Dissminater')]);
  const res = loadCode().submitRequest(pmSubmitPayload('NEW1'));
  assert.equal(res, 'pending_exists');
  assert.equal(ctx.history.values.length, 2);
  assert.equal(ctx.env.sent.length, 0);
});

test('保养新建：无在途时正常提交', () => {
  const ctx = setup(PM_DB, 'NEW2', []);
  const res = loadCode().submitRequest(pmSubmitPayload('NEW2'));
  assert.equal(res, true);
  assert.equal(ctx.history.values.length, 2);
  assert.equal(ctx.env.sent.length, 1);
});

test('点检修改/作废：在途时拒绝', () => {
  const ctx = setup(IN_DB, '6AX', [historyRow('6AX', '作废待审批/ Void Pending')]);
  const res = loadCode().dataSave_IN.apply(null, inDataSavePayload('6AX'));
  assert.equal(res, 'pending_exists');
  assert.equal(ctx.history.values.length, 2);
});

test('点检新建：在途时拒绝', () => {
  const ctx = setup(IN_DB, 'NEW1', [historyRow('NEW1', '待审批/ Pending')]);
  const res = loadCode().submitRequest_IN(inSubmitPayload('NEW1'));
  assert.equal(res, 'pending_exists');
  assert.equal(ctx.history.values.length, 2);
  assert.equal(ctx.env.sent.length, 0);
});

test('点检新建：无在途时正常提交', () => {
  const ctx = setup(IN_DB, 'NEW3', []);
  const res = loadCode().submitRequest_IN(inSubmitPayload('NEW3'));
  assert.equal(res, true);
  assert.equal(ctx.history.values.length, 2);
  assert.equal(ctx.env.sent.length, 1);
});

test('历史机型带空格仍能匹配', () => {
  const ctx = setup(PM_DB, '6AX', [historyRow(' 6AX ', '待审批/ Pending')]);
  const res = loadCode().dataSave.apply(null, pmDataSavePayload('6AX'));
  assert.equal(res, 'pending_exists');
  assert.equal(ctx.history.values.length, 2);
});

test('其他机型的在途申请不拦截', () => {
  setup(PM_DB, '6AX', [historyRow('OTHER', '待审批/ Pending')]);
  const res = loadCode().dataSave.apply(null, pmDataSavePayload('6AX'));
  assert.equal(res, true);
});
