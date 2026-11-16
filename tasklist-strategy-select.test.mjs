// 保养策略下拉渲染：数据为空时不得伪造默认选中值
// 运行：node --test tasklist-strategy-select.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function extractFn(src, name) {
  const start = src.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `未找到 function ${name}`);
  let depth = 0;
  for (let i = src.indexOf('{', start); i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error(`function ${name} 大括号不平衡`);
}

const src = fs.readFileSync('Tasklist_MoC_Modify_JS.html', 'utf8');
const buildStrategySelectHtml_ = new Function(
  `${extractFn(src, 'buildStrategySelectHtml_')}; return buildStrategySelectHtml_;`
)();

test('空值显示「请选择」而不是默认预防性', () => {
  const html = buildStrategySelectHtml_('');
  assert.ok(html.includes('<option value="" selected>请选择/ Please select</option>'));
  assert.ok(!/value="预防性\/ Preventive" selected/.test(html));
});

test('历史占位值显示「请选择」', () => {
  const html = buildStrategySelectHtml_('请选择/ Please select');
  assert.ok(html.includes('<option value="" selected>请选择/ Please select</option>'));
});

test('标准值「预防性/ Preventive」选中对应选项', () => {
  const html = buildStrategySelectHtml_('预防性/ Preventive');
  assert.ok(/value="预防性\/ Preventive" selected/.test(html));
  assert.ok(!html.includes('<option value="" selected>'));
});

test('预测性选中对应选项', () => {
  const html = buildStrategySelectHtml_('预测性/ Predictive');
  assert.ok(/value="预测性\/ Predictive" selected/.test(html));
});

test('历史变体「预防性」匹配到标准选项', () => {
  const html = buildStrategySelectHtml_('预防性');
  assert.ok(/value="预防性\/ Preventive" selected/.test(html));
});
