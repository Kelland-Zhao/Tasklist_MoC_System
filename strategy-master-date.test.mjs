import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode, installGas, makeSheet } from './strategy-test-utils.mjs';

const g = loadCode();
const MASTER = g.STRATEGY_MASTER_SHEET_NAME;

function masterSheetWithDate() {
  const headers = g.STRATEGY_MASTER_HEADERS.slice();
  const row = headers.map(function () { return ''; });
  row[0] = 'IM';
  row[headers.indexOf('Machine Type')] = '6AX';
  row[headers.indexOf('策略ID')] = 'PM-MD-0001';
  row[headers.indexOf('生效时间')] = new Date(2026, 10, 13, 14, 46, 32);
  return makeSheet([headers, row]);
}

test('主数据日期单元格转为字符串，避免 google.script.run 序列化失败', () => {
  installGas({ sheetsById: { [g.STRATEGY_SS_ID]: { [MASTER]: masterSheetWithDate() } } });
  const calls = [];
  const originalFormat = globalThis.Utilities.formatDate;
  globalThis.Utilities.formatDate = function (value, timeZone, format) {
    calls.push([value, timeZone, format]);
    return originalFormat.apply(null, arguments);
  };

  const res = g.getStrategyMasterData();

  assert.equal(res.rows.length, 1);
  assert.equal(typeof res.rows[0]['生效时间'], 'string');
  assert.equal(res.rows[0]['生效时间'], '2026-11-11 10:00:00');
  assert.equal(calls.length, 1);
  assert.ok(calls[0][0] instanceof Date);
  assert.equal(calls[0][1], 'Asia/Shanghai');
  assert.equal(calls[0][2], 'yyyy-MM-dd HH:mm:ss');
});

test('主数据普通文本字段保持不变', () => {
  installGas({ sheetsById: { [g.STRATEGY_SS_ID]: { [MASTER]: masterSheetWithDate() } } });

  const res = g.getStrategyMasterData();

  assert.equal(res.rows[0]['工序'], 'IM');
  assert.equal(res.rows[0]['Machine Type'], '6AX');
  assert.equal(res.rows[0]['策略ID'], 'PM-MD-0001');
});
