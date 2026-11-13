import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode, installGas, makeSheet } from './strategy-test-utils.mjs';

const SS = '13LZMFurFP6Lc-iM0UrpNsoYDBgPHDBKVDfFxJ3G8bLs';
const SHEET = '保养策略记录表';

function makeValues() {
  return [
    ['保养策略记录表'],
    ['', '', '', '', '', '', '', '', '', 'EQU-R-MAC-043-00'],
    [
      '工序 Process', '机型 Machine Type', '保养频率 PM Frequency', '单次停机时间 / h',
      '保养描述 PM Description', 'RBM保养间隔时间', 'RBM保养提醒间隔时间', '强制保养频率',
      '策略 Strategy', '任务清单名称', '是否创工单', '工单类型', '是否计入AEM', '备注',
    ],
    ['FA', 'ACH', '半年', '24', '空压机半年保养', '', '', '', 'RBM', '', 'Y', 'PM02', 'NA', '（老空压机）'],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['IM', '6AX', '月', '2', '注塑机月保养', '', '', '', 'TBM', 'INJ-01', 'Y', 'PM02', 'NA', ''],
  ];
}

test('从第 1 行读取标题与文件编号，数据从表头后开始', () => {
  installGas({ sheetsById: { [SS]: { [SHEET]: makeSheet(makeValues()) } } });
  const res = loadCode().getStrategyRecordData();

  assert.equal(res.ok, true);
  assert.equal(res.title, '保养策略记录表');
  assert.equal(res.docNo, 'EQU-R-MAC-043-00');
  assert.equal(res.rows.length, 2);
  assert.equal(res.rows[0].length, 14);
  assert.equal(res.rows[0][0], 'FA');
  assert.equal(res.rows[1][1], '6AX');
});

test('空表安全返回', () => {
  installGas({ sheetsById: { [SS]: { [SHEET]: makeSheet([]) } } });
  const res = loadCode().getStrategyRecordData();

  assert.equal(res.ok, true);
  assert.equal(res.title, '保养策略记录表');
  assert.equal(res.docNo, '');
  assert.equal(res.rows.length, 0);
});

test('标题为空时用 sheet 名兜底，编号为空时返回空串', () => {
  const values = [
    [''],
    [''],
    [
      '工序 Process', '机型 Machine Type', '保养频率 PM Frequency', '单次停机时间 / h',
      '保养描述 PM Description', 'RBM保养间隔时间', 'RBM保养提醒间隔时间', '强制保养频率',
      '策略 Strategy', '任务清单名称', '是否创工单', '工单类型', '是否计入AEM', '备注',
    ],
    ['FA', 'ACH', '半年', '24', '空压机半年保养', '', '', '', 'RBM', '', 'Y', 'PM02', 'NA', '（老空压机）'],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', ''],
  ];
  installGas({ sheetsById: { [SS]: { [SHEET]: makeSheet(values) } } });
  const res = loadCode().getStrategyRecordData();

  assert.equal(res.ok, true);
  assert.equal(res.title, '保养策略记录表');
  assert.equal(res.docNo, '');
  assert.equal(res.rows.length, 1);
});

test('只有前两行时数据为空', () => {
  const values = [
    ['保养策略记录表'],
    ['EQU-R-MAC-043-00'],
  ];
  installGas({ sheetsById: { [SS]: { [SHEET]: makeSheet(values) } } });
  const res = loadCode().getStrategyRecordData();

  assert.equal(res.ok, true);
  assert.equal(res.title, '保养策略记录表');
  assert.equal(res.docNo, 'EQU-R-MAC-043-00');
  assert.equal(res.rows.length, 0);
});

test('sheet 缺失返回失败', () => {
  installGas({ sheetsById: { [SS]: {} } });
  const res = loadCode().getStrategyRecordData();

  assert.equal(res.ok, false);
  assert.ok(res.message);
});
