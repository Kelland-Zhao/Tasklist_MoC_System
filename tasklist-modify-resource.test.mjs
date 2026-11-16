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
const buildResourceSelectHtml_ = new Function(
  `${extractFn(src, 'buildResourceSelectHtml_')}; return buildResourceSelectHtml_;`
)();

test('标准值「技术员/ Technician」（单数）选中标准选项，不重复添加', () => {
  const html = buildResourceSelectHtml_('技术员/ Technician');
  assert.ok(html.includes('<option value="技术员/ Technician" selected>技术员/ Technician</option>'));
  assert.equal((html.match(/技术员\/ Technician/g) || []).length, 2); // value + 文本
  assert.ok(!html.includes('Technicians'));
});

test('历史值「技术员/ Technicians」（复数）作为额外选项选中', () => {
  const html = buildResourceSelectHtml_('技术员/ Technicians');
  assert.ok(html.includes('<option value="技术员/ Technicians" selected>技术员/ Technicians</option>'));
  assert.ok(html.includes('请选择/ Please select'));
});

test('空值只显示占位，不添加额外选项', () => {
  const html = buildResourceSelectHtml_('');
  assert.ok(html.includes('请选择/ Please select'));
  assert.ok(!html.includes('selected'));
});

test('历史值做 HTML 转义', () => {
  const html = buildResourceSelectHtml_('技术员"><img src=x>');
  assert.ok(html.includes('&quot;&gt;&lt;img src=x&gt;'));
  assert.ok(!html.includes('<img src=x>'));
});

test('编辑页执行人列使用统一构造函数', () => {
  assert.ok(src.includes('return buildResourceSelectHtml_(data);'));
});

test('编辑/新建页统一使用单数 Technician 选项', () => {
  ['Tasklist_MoC_Modify_JS.html', 'Tasklist_Create_JS.html', 'Inspection_Create_JS.html'].forEach((file) => {
    const text = fs.readFileSync(file, 'utf8');
    assert.ok(text.includes('技术员/ Technician'), file);
    assert.ok(!text.includes('技术员/ Technicians'), file);
  });
});
