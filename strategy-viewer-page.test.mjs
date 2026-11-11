import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { extractScript } from './strategy-test-utils.mjs';

const src = extractScript(fs.readFileSync('Strategy_Viewer_JS.html','utf8'));
const api = new Function(`${src}; return { buildStrategyVersionHistory };`)();

test('版本历史按版本倒序且只含该策略', () => {
  const rows = [
    { 'Strategy Content': JSON.stringify({ strategyId:'PM-MD-0001', version:'00' }), Status:'取代/ Replace' },
    { 'Strategy Content': JSON.stringify({ strategyId:'PM-MD-0001', version:'01' }), Status:'生效/ Effective' },
    { 'Strategy Content': JSON.stringify({ strategyId:'PM-MD-0002', version:'00' }), Status:'生效/ Effective' },
  ];
  const v = api.buildStrategyVersionHistory(rows,'PM-MD-0001');
  assert.equal(v.length, 2);
  assert.equal(v[0].version, '01');
});
