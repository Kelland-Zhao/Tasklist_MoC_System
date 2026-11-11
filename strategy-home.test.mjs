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

test('策略待办徽章在 total=0 / 请求失败时清零并隐藏', () => {
  assert.match(js, /getStrategyPendingCounts\(/);

  // 提取 getStrategyPendingCounts 的 success handler，用假 jQuery 执行以验证重置行为
  const m = js.match(/withSuccessHandler\(r => \{([\s\S]*?)\}\)\s*\.getStrategyPendingCounts\(/);
  assert.ok(m, '未找到 getStrategyPendingCounts 的 success handler');
  const run = new Function('$', 'r', m[1]);
  const badges = {
    '#badge_strategy': { text: '', shown: null },
    '#tabBadgeStrategy': { text: '', shown: null }
  };
  const $ = (sel) => {
    const badge = badges[sel];
    return {
      text(v) { badge.text = String(v); return this; },
      toggle(v) { badge.shown = !!v; return this; }
    };
  };

  run($, { total: 3 });
  assert.deepEqual(badges['#badge_strategy'], { text: '3', shown: true });
  assert.deepEqual(badges['#tabBadgeStrategy'], { text: '3', shown: true });

  run($, { total: 0 });
  assert.deepEqual(badges['#badge_strategy'], { text: '0', shown: false });
  assert.deepEqual(badges['#tabBadgeStrategy'], { text: '0', shown: false });

  run($, null); // 请求失败也要清零隐藏
  assert.deepEqual(badges['#badge_strategy'], { text: '0', shown: false });
  assert.deepEqual(badges['#tabBadgeStrategy'], { text: '0', shown: false });
});
