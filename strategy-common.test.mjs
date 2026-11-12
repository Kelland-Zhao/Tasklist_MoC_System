import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { extractScript } from './strategy-test-utils.mjs';

const src = extractScript(fs.readFileSync(new URL('./Strategy_Common_JS.html', import.meta.url), 'utf8'));
const api = new Function(`${src}; return { STRATEGY_FIELDS, strategyActionLabel, strategyDiffRows, strategyStatusBadge, formatStrategyId, convertFrequencyToMonths, filterStrategyMasterRows, strategyRequiredKeysFor, strategyNormalizeConditionalFields };`)();

const ALWAYS_REQUIRED = ['工序', 'Machine Type', 'PM Frequency', 'PM Description', '策略 / Strategy', '单次停机时间/ h', 'TasklistName', '是否创工单', '是否计入AEM'];
const RBM_REQUIRED = ['RBM保养间隔时间', 'RBM保养提醒间隔时间', '强制保养频率/ Month'];

test('必填键：始终必填的 9 个字段', () => {
  assert.deepEqual(api.strategyRequiredKeysFor({}), ALWAYS_REQUIRED);
});

test('必填键：RBM 追加三个 RBM 字段', () => {
  const keys = api.strategyRequiredKeysFor({ '策略 / Strategy': 'RBM', '是否创工单': 'N' });
  assert.deepEqual(keys, ALWAYS_REQUIRED.concat(RBM_REQUIRED));
});

test('必填键：策略 trim 后等于 RBM 才追加', () => {
  const keys = api.strategyRequiredKeysFor({ '策略 / Strategy': ' RBM ', '是否创工单': 'N' });
  assert.deepEqual(keys, ALWAYS_REQUIRED.concat(RBM_REQUIRED));
});

test('必填键：是否创工单 trim 后等于 Y 追加工单类型', () => {
  const keys = api.strategyRequiredKeysFor({ '策略 / Strategy': 'TBM', '是否创工单': ' Y ' });
  assert.deepEqual(keys, ALWAYS_REQUIRED.concat(['工单类型']));
});

test('必填键：RBM + Y 追加全部条件字段', () => {
  const keys = api.strategyRequiredKeysFor({ '策略 / Strategy': 'RBM', '是否创工单': 'Y' });
  assert.deepEqual(keys, ALWAYS_REQUIRED.concat(RBM_REQUIRED, ['工单类型']));
});

test('规范化：非 RBM 三个 RBM 字段写 NA，且不修改入参', () => {
  const input = { '策略 / Strategy': 'TBM', '是否创工单': 'N', 'RBM保养间隔时间': '6', 'RBM保养提醒间隔时间': '1', '强制保养频率/ Month': '3', '工单类型': '' };
  const result = api.strategyNormalizeConditionalFields(input);
  assert.notEqual(result, input);
  assert.equal(result['RBM保养间隔时间'], 'NA');
  assert.equal(result['RBM保养提醒间隔时间'], 'NA');
  assert.equal(result['强制保养频率/ Month'], 'NA');
  assert.equal(result['工单类型'], 'NA');
  assert.equal(input['RBM保养间隔时间'], '6');
});

test('规范化：RBM + Y 保留原值', () => {
  const input = { '策略 / Strategy': 'RBM', '是否创工单': 'Y', 'RBM保养间隔时间': '6', 'RBM保养提醒间隔时间': '1', '强制保养频率/ Month': '3', '工单类型': 'PM10' };
  assert.deepEqual(api.strategyNormalizeConditionalFields(input), input);
});

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
