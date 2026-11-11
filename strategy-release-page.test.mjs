import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { extractScript } from './strategy-test-utils.mjs';

const src = extractScript(fs.readFileSync(new URL('./Strategy_Release_JS.html', import.meta.url), 'utf8'));
const api = new Function(`${src}; return { buildStrategyReleasePayload, buildStrategyReturnPayload };`)();

test('发放 payload', () => {
  const p = api.buildStrategyReleasePayload({ Operator:'OP-1' }, { jobNumber:'10003', name:'文控丙' });
  assert.equal(p.operator, 'OP-1');
});
test('退回必须填原因', () => {
  assert.equal(api.buildStrategyReturnPayload({ Operator:'OP-1' }, '', { jobNumber:'10003', name:'文控丙' }), null);
  assert.equal(api.buildStrategyReturnPayload({ Operator:'OP-1' }, '信息不全', { jobNumber:'10003', name:'文控丙' }).reason, '信息不全');
});
