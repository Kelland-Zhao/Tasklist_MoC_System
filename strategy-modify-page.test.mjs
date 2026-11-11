import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { extractScript } from './strategy-test-utils.mjs';

const src = extractScript(fs.readFileSync(new URL('./Strategy_Modify_JS.html', import.meta.url), 'utf8'));
const api = new Function(`${src}; return { buildStrategyEditPayload };`)();

test('修改 payload 带 strategyId 与 old.version', () => {
  const p = api.buildStrategyEditPayload('PM-MD-0001', { '工序':'IM','版本号':'00' }, { '工序':'IM','备注':'x' }, { jobNumber:'10001', name:'林飞' }, '调整频率');
  assert.equal(p.strategyId, 'PM-MD-0001');
  assert.equal(p.old.version, '00');
  assert.equal(p.reason, '调整频率');
});

test('缺策略ID、变更原因或必填字段返回 null', () => {
  const old = { '工序':'IM','版本号':'00' };
  const user = { jobNumber:'10001', name:'林飞' };
  const values = {
    '工序':'IM',
    'Machine Type':'FCS',
    'PM Frequency':'季',
    'PM Description':'季度保养',
    '策略 / Strategy':'RBM'
  };
  assert.equal(api.buildStrategyEditPayload('PM-MD-0001', old, values, user, ''), null);
  assert.equal(api.buildStrategyEditPayload('', old, values, user, '调整频率'), null);
  assert.equal(api.buildStrategyEditPayload('PM-MD-0001', old, { ...values, 'PM Description':'' }, user, '调整频率'), null);
});

/* 安全回归：URL 参数注入到 <script> 前必须转义 <，防止构造 </script> 逃逸 */
const pageHtml = fs.readFileSync(new URL('./Strategy_Modify.html', import.meta.url), 'utf8');

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
