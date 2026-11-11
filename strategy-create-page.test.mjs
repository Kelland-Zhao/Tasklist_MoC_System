import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { extractScript } from './strategy-test-utils.mjs';

const src = extractScript(fs.readFileSync(new URL('./Strategy_Create_JS.html', import.meta.url), 'utf8'));
const api = new Function(`${src}; return { buildStrategyCreatePayload };`)();
const values = { '工序':'IM','Machine Type':'FCS','PM Frequency':'季','PM Description':'季度保养','策略 / Strategy':'RBM' };

test('新建 payload 结构', () => {
  const p = api.buildStrategyCreatePayload(values, { jobNumber:'10001', name:'林飞' }, '新增');
  assert.equal(p.jobNumber, '10001');
  assert.equal(p.reason, '新增');
  assert.equal(p.fields['工序'], 'IM');
});
test('缺必填字段返回 null', () => {
  assert.equal(api.buildStrategyCreatePayload({ ...values, 'PM Description':'' }, { jobNumber:'10001', name:'林飞' }, '新增'), null);
});
