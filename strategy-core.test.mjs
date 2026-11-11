import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from './strategy-test-utils.mjs';

const g = loadCode();

test('strategyAction_ 根据 old/new 推断', () => {
  assert.equal(g.strategyAction_({ new: {} }), 'new');
  assert.equal(g.strategyAction_({ old: {} }), 'void');
  assert.equal(g.strategyAction_({ old: {}, new: {} }), 'edit');
});

test('strategyDisplayId_ 拼接两位版本号', () => {
  assert.equal(g.strategyDisplayId_('PM-MD-0001', '1'), 'PM-MD-0001-01');
  assert.equal(g.strategyDisplayId_('PM-MD-0001', '00'), 'PM-MD-0001-00');
});

test('normalizeStrategyVersion_ 两位补零', () => {
  assert.equal(g.normalizeStrategyVersion_(1), '01');
  assert.equal(g.normalizeStrategyVersion_('00'), '00');
});

test('nextStrategyId_ 取最大号加一', () => {
  assert.equal(g.nextStrategyId_(['PM-MD-0001', 'PM-MD-0080']), 'PM-MD-0081');
  assert.equal(g.nextStrategyId_([]), 'PM-MD-0001');
});
