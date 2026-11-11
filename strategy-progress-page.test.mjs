import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { extractScript } from './strategy-test-utils.mjs';

const src = extractScript(fs.readFileSync(new URL('./Strategy_Progress_JS.html', import.meta.url), 'utf8'));
const api = new Function(`${src}; return { filterStrategyHistoryRows };`)();

test('按工序/状态过滤', () => {
  const rows = [{ Process:'IM', Status:'待审批/ Pending' },{ Process:'TF', Status:'生效/ Effective' }];
  assert.equal(api.filterStrategyHistoryRows(rows,{ process:'IM', status:'' },false,'').length, 1);
  assert.equal(api.filterStrategyHistoryRows(rows,{ process:'', status:'生效/ Effective' },false,'').length, 1);
});
test('只看我的申请', () => {
  const rows = [{ submitMail:'me@colpal.com' },{ submitMail:'other@colpal.com' }];
  assert.equal(api.filterStrategyHistoryRows(rows,{},true,'me@colpal.com').length, 1);
});
