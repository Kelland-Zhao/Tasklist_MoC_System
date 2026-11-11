import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('./Tasklist_Home.html', import.meta.url), 'utf8');
const js = fs.readFileSync(new URL('./Tasklist_Home_JS.html', import.meta.url), 'utf8');

test('策略页签与 8 张卡存在', () => {
  assert.match(html, /id="pane-strategy"/);
  for (const id of ['strategy_create','strategy_modify','strategy_void','strategy_approval1','strategy_approval2','strategy_release','strategy_progress','strategy_viewer']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
});

test('PAGE_MAP 映射 8 个 page key', () => {
  for (const key of ['strategy_create','strategy_modify','strategy_void','strategy_approval1','strategy_approval2','strategy_release','strategy_progress','strategy_viewer']) {
    assert.match(js, new RegExp(`${key}:\\s*'${key}'`));
  }
});

test('卡片权限属性正确', () => {
  assert.match(html, /id="strategy_create"[\s\S]{0,200}data-perm="编辑"|data-perm="编辑"[\s\S]{0,200}id="strategy_create"/);
  assert.match(html, /data-perm="作废"[\s\S]{0,200}id="strategy_void"/);
  assert.match(html, /data-perm="策略工序经理"[\s\S]{0,200}id="strategy_approval1"/);
  assert.match(html, /data-perm="策略部门经理"[\s\S]{0,200}id="strategy_approval2"/);
});
