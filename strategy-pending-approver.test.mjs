import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode, installGas, makeSheet, makeUserRow } from './strategy-test-utils.mjs';

const g = loadCode();

function setup(historyRows, extraUsers) {
  const history = makeSheet([g.STRATEGY_HISTORY_HEADERS.slice()].concat(historyRows));
  const userRows = [
    [],
    [],
    makeUserRow({ jobNumber:'10001', name:'工序甲', pwd:'*', gmail:'pm.im@colpal.com', process:'IM', auth:'编辑,策略工序经理' }),
    makeUserRow({ jobNumber:'10002', name:'部门乙', pwd:'*', gmail:'dept@colpal.com', process:'ALL', auth:'策略部门经理' }),
    makeUserRow({ jobNumber:'10003', name:'文控丙', pwd:'*', gmail:'doc@colpal.com', process:'ALL', auth:'作废,发放' }),
  ];
  (extraUsers || []).forEach(function (user) { userRows.push(user); });
  installGas({
    sheetsById: {
      [g.STRATEGY_SS_ID]: { [g.STRATEGY_HISTORY_SHEET_NAME]: history },
      [g.STRATEGY_USERID_SS_ID]: { userID: makeSheet(userRows) },
    },
  });
  return history;
}

function historyRow(options) {
  const opts = options || {};
  return [
    opts.machineType || '6AX',
    JSON.stringify({ strategyId: 'PM-MD-0001', version: '01', old: {}, new: {} }),
    '10001/ 申请人 2026-11-13',
    '测试',
    opts.approver1 || '',
    '',
    opts.approver2 || '',
    '',
    opts.dissminater || '',
    opts.status || g.STRATEGY_STATUS.pending,
    'applicant@colpal.com',
    opts.process || 'IM',
  ];
}

test('待审批且工序经理未批时，当前审批人是工序经理', () => {
  setup([historyRow({ status: g.STRATEGY_STATUS.pending })]);
  const rows = g.getStrategyHistoryData().rows;
  assert.deepEqual(rows[0].CurrentApproverEmails, ['pm.im@colpal.com']);
  assert.deepEqual(rows[0].CurrentApproverNames, ['工序甲']);
});

test('工序经理已批、部门经理未批时，当前审批人是部门经理', () => {
  setup([historyRow({ status: g.STRATEGY_STATUS.pending, approver1: '批准/ Approve pm.im@colpal.com 2026-11-13' })]);
  const rows = g.getStrategyHistoryData().rows;
  assert.deepEqual(rows[0].CurrentApproverEmails, ['dept@colpal.com']);
  assert.deepEqual(rows[0].CurrentApproverNames, ['部门乙']);
});

test('待发放时当前审批人是文控', () => {
  setup([historyRow({
    status: g.STRATEGY_STATUS.waitRelease,
    approver1: '批准/ Approve pm.im@colpal.com 2026-11-13',
    approver2: '批准/ Approve dept@colpal.com 2026-11-13',
  })]);
  const rows = g.getStrategyHistoryData().rows;
  assert.deepEqual(rows[0].CurrentApproverEmails, ['doc@colpal.com']);
});

test('作废待审批同样按审批链返回当前审批人', () => {
  setup([historyRow({ status: g.STRATEGY_STATUS.voidPending })]);
  const rows = g.getStrategyHistoryData().rows;
  assert.deepEqual(rows[0].CurrentApproverEmails, ['pm.im@colpal.com']);
});

test('同一角色多人时返回全部合格审批人', () => {
  setup([historyRow({ status: g.STRATEGY_STATUS.pending, approver1: '批准/ Approve pm.im@colpal.com 2026-11-13' })], [
    makeUserRow({ jobNumber:'10004', name:'部门丁', pwd:'*', gmail:'dept2@colpal.com', process:'ALL', auth:'策略部门经理' }),
  ]);
  const rows = g.getStrategyHistoryData().rows;
  assert.deepEqual(rows[0].CurrentApproverEmails, ['dept@colpal.com', 'dept2@colpal.com']);
  assert.deepEqual(rows[0].CurrentApproverNames, ['部门乙', '部门丁']);
});

test('工序无匹配审批人时返回空集合', () => {
  setup([historyRow({ status: g.STRATEGY_STATUS.pending, process: 'TF' })]);
  const rows = g.getStrategyHistoryData().rows;
  assert.deepEqual(rows[0].CurrentApproverEmails, []);
  assert.deepEqual(rows[0].CurrentApproverNames, []);
});

test('已生效/已拒绝不返回当前审批人', () => {
  setup([
    historyRow({ status: g.STRATEGY_STATUS.effective }),
    historyRow({ status: g.STRATEGY_STATUS.rejected }),
  ]);
  const rows = g.getStrategyHistoryData().rows;
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0].CurrentApproverEmails, []);
  assert.deepEqual(rows[1].CurrentApproverEmails, []);
});
