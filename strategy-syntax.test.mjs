import fs from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractScript } from './strategy-test-utils.mjs';

const files = fs.readdirSync('.').filter(f => /^Strategy_.*_JS\.html$/.test(f));
for (const f of files) {
  test(`${f} 可解析`, () => {
    assert.doesNotThrow(() => new Function(extractScript(fs.readFileSync(f,'utf8'))));
  });
}
