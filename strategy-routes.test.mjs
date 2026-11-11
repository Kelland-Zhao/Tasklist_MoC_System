import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const code = fs.readFileSync(new URL('./Code.js', import.meta.url), 'utf8');
for (const [key, file] of Object.entries({
  strategy_create: 'Strategy_Create', strategy_modify: 'Strategy_Modify', strategy_void: 'Strategy_Void',
  strategy_approval1: 'Strategy_Approval1', strategy_approval2: 'Strategy_Approval2',
  strategy_release: 'Strategy_Release', strategy_progress: 'Strategy_Progress', strategy_viewer: 'Strategy_Viewer'
})) {
  test(`路由 ${key}`, () => {
    assert.match(code, new RegExp(`${key}:\\s*"${file}"`));
    assert.match(code, new RegExp(`${key}:\\s*"[^"]+ / [^"]+"`));
  });
}
