import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { extractScript } from './strategy-test-utils.mjs';

const src = extractScript(fs.readFileSync(new URL('./Strategy_Common_JS.html', import.meta.url), 'utf8'));
const api = new Function(`${src}; return { STRATEGY_FIELDS, strategyActionLabel, strategyDiffRows, strategyStatusBadge, formatStrategyId, convertFrequencyToMonths, filterStrategyMasterRows };`)();

test('14 个业务字段齐备', () => assert.equal(api.STRATEGY_FIELDS.length, 14));
test('按工序+机型过滤策略行', () => {
  const rows = [{ '工序':'IM','Machine Type':'FCS','策略ID':'PM-MD-0001' },{ '工序':'TF','Machine Type':'FCS','策略ID':'PM-MD-0002' }];
  assert.equal(api.filterStrategyMasterRows(rows,'IM','FCS').length, 1);
});
test('动作标签', () => {
  assert.equal(api.strategyActionLabel({ new:{} }), '新增 / Create');
  assert.equal(api.strategyActionLabel({ old:{}, new:{} }), '修改 / Edit');
  assert.equal(api.strategyActionLabel({ old:{} }), '作废 / Void');
});
test('差异只标记变化字段', () => {
  const d = api.strategyDiffRows({ 'PM Description':'A', '备注':'' }, { 'PM Description':'B', '备注':'' });
  assert.equal(d.find(x => x.key === 'PM Description').changed, true);
  assert.equal(d.find(x => x.key === '备注').changed, false);
});
test('频率换算', () => {
  assert.equal(api.convertFrequencyToMonths('季'), 3);
  assert.equal(api.convertFrequencyToMonths('无法识别'), null);
});

// 追加：计划接口要求 strategyEscapeHtml，但计划测试片段未覆盖，单独补一条。
const escapeHtml = new Function(`${src}; return strategyEscapeHtml;`)();
test('HTML 转义', () => {
  assert.equal(escapeHtml(`<a href="x">&'`), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
});
