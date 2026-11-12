import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { extractScript, makeJQueryStub } from './strategy-test-utils.mjs';

const commonSrc = extractScript(fs.readFileSync(new URL('./Strategy_Common_JS.html', import.meta.url), 'utf8'));
const src = extractScript(fs.readFileSync(new URL('./Strategy_Create_JS.html', import.meta.url), 'utf8'));
const api = new Function(`${commonSrc}; ${src}; return { buildStrategyCreatePayload, applyStrategyCreateConditionalState, strategyCreateFieldHtml_, STRATEGY_FIELDS };`)();

function fullValues(overrides) {
  return {
    '工序': 'IM',
    'Machine Type': 'FCS',
    'PM Frequency': '季',
    '单次停机时间/ h': '8',
    'PM Description': '季度保养',
    'RBM保养间隔时间': '6',
    'RBM保养提醒间隔时间': '1',
    '强制保养频率/ Month': '3',
    '策略 / Strategy': 'RBM',
    'TasklistName': '[FCS]',
    '是否创工单': 'Y',
    '工单类型': 'PM10',
    '是否计入AEM': 'Y',
    '备注': '',
    ...(overrides || {})
  };
}

const user = { jobNumber: '10001', name: '林飞' };

test('新建 payload 结构', () => {
  const values = fullValues();
  const p = api.buildStrategyCreatePayload(values, user, '新增');
  assert.equal(p.jobNumber, '10001');
  assert.equal(p.reason, '新增');
  assert.equal(p.fields['工序'], 'IM');
  assert.equal(p.fields['RBM保养间隔时间'], '6');
});

test('缺任意始终必填字段返回 null', () => {
  ['单次停机时间/ h', 'TasklistName', '是否创工单', '是否计入AEM'].forEach((key) => {
    assert.equal(
      api.buildStrategyCreatePayload(fullValues({ [key]: '' }), user, '新增'),
      null,
      key
    );
  });
});

test('RBM 缺条件必填字段返回 null', () => {
  ['RBM保养间隔时间', 'RBM保养提醒间隔时间', '强制保养频率/ Month'].forEach((key) => {
    assert.equal(
      api.buildStrategyCreatePayload(fullValues({ [key]: '' }), user, '新增'),
      null,
      key
    );
  });
});

test('是否创工单 = Y 时工单类型必填', () => {
  assert.equal(api.buildStrategyCreatePayload(fullValues({ '工单类型': '' }), user, '新增'), null);
});

test('非 RBM 规范化三个 RBM 字段为 NA 且不要求必填', () => {
  const values = fullValues({
    '策略 / Strategy': 'TBM',
    'RBM保养间隔时间': '',
    'RBM保养提醒间隔时间': '',
    '强制保养频率/ Month': ''
  });
  const p = api.buildStrategyCreatePayload(values, user, '新增');
  assert.notEqual(p, null);
  assert.equal(p.fields['RBM保养间隔时间'], 'NA');
  assert.equal(p.fields['RBM保养提醒间隔时间'], 'NA');
  assert.equal(p.fields['强制保养频率/ Month'], 'NA');
  assert.equal(values['RBM保养间隔时间'], '', 'builder 不应修改入参');
});

test('是否创工单 = N 时工单类型规范化为 NA', () => {
  const p = api.buildStrategyCreatePayload(fullValues({ '是否创工单': 'N', '工单类型': '' }), user, '新增');
  assert.notEqual(p, null);
  assert.equal(p.fields['工单类型'], 'NA');
});

test('条件字段初始禁用并显示 NA，切换 RBM/Y 后启用并重新计算强制频率', () => {
  const jq = makeJQueryStub({
    '[data-strategy-field="策略 / Strategy"]': 'TBM',
    '[data-strategy-field="是否创工单"]': 'N',
    '[data-strategy-field="PM Frequency"]': '季'
  });
  api.applyStrategyCreateConditionalState(jq);
  ['RBM保养间隔时间', 'RBM保养提醒间隔时间', '强制保养频率/ Month', '工单类型'].forEach((key) => {
    assert.equal(jq(`[data-strategy-field="${key}"]`).prop('disabled'), true, key);
    assert.equal(jq(`[data-strategy-field="${key}"]`).val(), 'NA', key);
  });

  jq('[data-strategy-field="策略 / Strategy"]').val('RBM');
  jq('[data-strategy-field="是否创工单"]').val('Y');
  api.applyStrategyCreateConditionalState(jq);
  ['RBM保养间隔时间', 'RBM保养提醒间隔时间', '强制保养频率/ Month', '工单类型'].forEach((key) => {
    assert.equal(jq(`[data-strategy-field="${key}"]`).prop('disabled'), false, key);
  });
  assert.equal(jq('[data-strategy-field="强制保养频率/ Month"]').val(), '3');
});

test('条件字段渲染带动态必填标记', () => {
  const html = api.strategyCreateFieldHtml_(
    api.STRATEGY_FIELDS.find((field) => field.key === '工单类型'),
    10
  );
  assert.match(html, /data-strategy-required="工单类型"/);
});

/* 安全回归：URL 参数注入到 <script> 前必须转义 <，防止构造 </script> 逃逸 */
const pageHtml = fs.readFileSync(new URL('./Strategy_Create.html', import.meta.url), 'utf8');

function strategyInjection_(variable) {
  const match = pageHtml.match(new RegExp('var ' + variable + '=(<\\?![\\s\\S]*?\\?>)'));
  return match ? match[1] : '';
}

test('用户变量注入经过 < 转义', () => {
  ['STRATEGY_JOB_NUMBER', 'STRATEGY_USER_NAME'].forEach((variable) => {
    const expr = strategyInjection_(variable);
    assert.notEqual(expr, '', variable + ' 注入缺失');
    assert.match(expr, /JSON\.stringify\(/, variable + ' 需要 JSON.stringify');
    assert.match(expr, /\.replace\(\/<\//, variable + ' 需要 .replace(/</g 转义');
  });
});

test('不存在未转义的 JSON.stringify 直接输出', () => {
  assert.doesNotMatch(pageHtml, /<\?!=JSON\.stringify\(\s*(?:jobNumber|name)\s*\)\?>/);
});
