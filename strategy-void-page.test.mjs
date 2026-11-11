import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { extractScript } from './strategy-test-utils.mjs';

const src = extractScript(fs.readFileSync(new URL('./Strategy_Void_JS.html', import.meta.url), 'utf8'));
const api = new Function(`${src}; return { buildStrategyVoidPayload };`)();

test('作废 payload 无 new 字段', () => {
  const p = api.buildStrategyVoidPayload('PM-MD-0001', { '工序':'IM','版本号':'00' }, { jobNumber:'10003', name:'林飞' }, '停止保养');
  assert.equal(p.strategyId, 'PM-MD-0001');
  assert.equal(p.old.version, '00');
  assert.equal('fields' in p, false);
});
test('缺原因返回 null', () => {
  assert.equal(api.buildStrategyVoidPayload('PM-MD-0001', { '工序':'IM','版本号':'00' }, { jobNumber:'10003', name:'林飞' }, ''), null);
});

/* 安全回归：URL 参数注入到 <script> 前必须转义 <，防止构造 </script> 逃逸 */
const pageHtml = fs.readFileSync(new URL('./Strategy_Void.html', import.meta.url), 'utf8');

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
