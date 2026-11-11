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
