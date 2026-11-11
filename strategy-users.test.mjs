import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeSheet, makeUserRow, installGas, loadCode } from './strategy-test-utils.mjs';

const users = makeSheet([
  [], [],
  makeUserRow({ jobNumber:'10001', name:'工序甲', pwd:'*', gmail:'pm.im@colpal.com', process:'IM', auth:'编辑,策略工序经理' }),
  makeUserRow({ jobNumber:'10002', name:'部门乙', pwd:'*', gmail:'dept@colpal.com', process:'ALL', auth:'策略部门经理' }),
  makeUserRow({ jobNumber:'10003', name:'文控丙', pwd:'*', gmail:'doc@colpal.com', process:'ALL', auth:'发放' }),
]);
installGas({ sheetsById: { '1F7G3WOY5xM4fEYZ1s5RKulY4kJhqCZ9HefthmiVkraM': { userID: users } }, sent: [] });
const g = loadCode();

test('按工序解析工序经理', () => {
  const a = g.getStrategyApprovers_('IM');
  assert.equal(a.processManager.email, 'pm.im@colpal.com');
  assert.equal(a.deptManager.email, 'dept@colpal.com');
  assert.equal(a.docControl.email, 'doc@colpal.com');
});

test('工序无经理时返回 null', () => {
  assert.equal(g.getStrategyApprovers_('TF').processManager, null);
});

test('getPasswordData 带出 Process 与 Email', () => {
  const [rows] = g.getPasswordData();
  const user = rows.find(r => String(r.JobNumber).trim() === '10001');
  assert.equal(user.Process, 'IM');
  assert.equal(user.Email, 'pm.im@colpal.com');
});
