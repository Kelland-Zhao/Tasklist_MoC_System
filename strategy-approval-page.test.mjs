import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { extractScript } from './strategy-test-utils.mjs';

const src = extractScript(fs.readFileSync(new URL('./Strategy_Approval_JS.html', import.meta.url), 'utf8'));
const api = new Function(`${src}; return { buildStrategyApprovalPayload };`)();

test('工序经理批准 payload', () => {
  const p = api.buildStrategyApprovalPayload({ Operator:'OP-1', Process:'IM' }, 'approve', '同意', 1, { jobNumber:'10001', name:'工序甲' });
  assert.equal(p.level, 1);
  assert.equal(p.decision, 'approve');
  assert.equal(p.operator, 'OP-1');
});
test('部门经理拒绝 payload', () => {
  const p = api.buildStrategyApprovalPayload({ Operator:'OP-2' }, 'reject', '', 2, { jobNumber:'10002', name:'部门乙' });
  assert.equal(p.level, 2);
  assert.equal(p.decision, 'reject');
});
