import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { extractScript } from './strategy-test-utils.mjs';

const lockSrc = extractScript(fs.readFileSync('Pending_Lock_JS.html', 'utf8'));
const statusMatch = lockSrc.match(/var TASKLIST_PENDING_STATUSES = \[([\s\S]*?)\];/);
assert.ok(statusMatch, 'Pending_Lock_JS 未找到 TASKLIST_PENDING_STATUSES');
const PENDING_STATUSES = [...statusMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);

const src = extractScript(fs.readFileSync('Strategy_Progress_JS.html', 'utf8'));
const api = new Function(
  'TASKLIST_PENDING_STATUSES',
  `${src}; return { strategyProgressInFlight_, buildStrategyProgressSteps_, strategyProgressCurrentIdx_, strategyProgressFlowHtml_, strategyProgressStatusBorderColor_, strategyProgressIsMine_, setMail: function (m) { strategyProgressUserMail = m; } };`
)(PENDING_STATUSES);

test('进度页只把三种状态视为在途', () => {
  assert.deepEqual(PENDING_STATUSES, [
    '待审批/ Pending',
    '待发放/ Wait for Dissminater',
    '作废待审批/ Void Pending',
  ]);
  PENDING_STATUSES.forEach((status) => {
    assert.equal(api.strategyProgressInFlight_(status), true, status);
  });
  ['生效/ Effective', '取代/ Replace', '作废/ Void', '拒绝/ Rejected', ''].forEach((status) => {
    assert.equal(api.strategyProgressInFlight_(status), false, status);
  });
});

test('审批步骤按 工序经理 → 部门经理 → 文控 推进', () => {
  const idx = (row) => api.strategyProgressCurrentIdx_(api.buildStrategyProgressSteps_(row));

  assert.equal(idx({ Approver1: '', Approver2: '', Dissminater: '' }), 0);
  assert.equal(idx({ Approver1: '批准/ Approve pm.im@colpal.com 2026-11-13', Approver2: '', Dissminater: '' }), 1);
  assert.equal(idx({
    Approver1: '批准/ Approve pm.im@colpal.com 2026-11-13',
    Approver2: '批准/ Approve dept@colpal.com 2026-11-13',
    Dissminater: '',
  }), 2);
  assert.equal(idx({
    Approver1: '批准/ Approve pm.im@colpal.com 2026-11-13',
    Approver2: '批准/ Approve dept@colpal.com 2026-11-13',
    Dissminater: '批准/ Approve doc@colpal.com 2026-11-13',
  }), -1);
});

test('流程 HTML 标出当前节点和当前审批人', () => {
  const html = api.strategyProgressFlowHtml_({
    Approver1: '批准/ Approve pm.im@colpal.com 2026-11-13',
    Approver2: '',
    Dissminater: '',
    CurrentApproverNames: ['部门乙'],
    CurrentApproverEmails: ['dept@colpal.com'],
  });

  assert.ok(html.includes('工序经理'));
  assert.ok(html.includes('部门经理'));
  assert.ok(html.includes('文控'));
  assert.ok(html.includes('flow-dot done'));
  assert.ok(html.includes('flow-dot current'));
  assert.ok(html.includes('部门乙'));
});

test('只看待我审批支持同一角色多人', () => {
  api.setMail('dept2@colpal.com');
  assert.equal(api.strategyProgressIsMine_({ CurrentApproverEmails: ['dept@colpal.com', 'dept2@colpal.com'] }), true);
  assert.equal(api.strategyProgressIsMine_({ CurrentApproverEmails: ['dept@colpal.com'] }), false);
  api.setMail('');
  assert.equal(api.strategyProgressIsMine_({ CurrentApproverEmails: ['dept@colpal.com'] }), false);
});

test('状态色边框：待审批/待发放黄，作废待审批红', () => {
  assert.equal(api.strategyProgressStatusBorderColor_('待审批/ Pending'), '#ffc107');
  assert.equal(api.strategyProgressStatusBorderColor_('待发放/ Wait for Dissminater'), '#ffc107');
  assert.equal(api.strategyProgressStatusBorderColor_('作废待审批/ Void Pending'), '#dc3545');
  assert.equal(api.strategyProgressStatusBorderColor_('生效/ Effective'), '#adb5bd');
});

test('策略进度页 UI 已对齐清单页', () => {
  const html = fs.readFileSync('Strategy_Progress.html', 'utf8');
  const js = fs.readFileSync('Strategy_Progress_JS.html', 'utf8');

  assert.ok(html.includes('id="summaryBar"'));
  assert.ok(html.includes('id="sbMine"'));
  assert.ok(html.includes('id="sbTotal"'));
  assert.ok(html.includes('id="onlyMine"'));
  assert.ok(html.includes('include("Pending_Lock_JS")'));
  assert.ok(html.includes('审批流程<br><small>Approval Flow</small>'));
  assert.ok(html.includes('.dataTables_scrollHead thead th'));
  assert.ok(js.includes('initStrategyProgressTable_'));
  assert.ok(js.includes('strategyProgressInFlight_'));
  assert.ok(js.includes('CurrentApproverEmails'));
  assert.ok(js.includes('strategyProgressTextRender_'));
});
