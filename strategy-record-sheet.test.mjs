import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeSheet, installGas, loadCode } from './strategy-test-utils.mjs';

const g = loadCode();

function baseFields(overrides) {
  return Object.assign({
    '工序': 'IM',
    'Machine Type': 'FCS',
    'PM Frequency': '季',
    '单次停机时间/ h': '8',
    'PM Description': '季度保养',
    'RBM保养间隔时间': '6',
    'RBM保养提醒间隔时间': '1',
    '强制保养频率/ Month': '3',
    '策略 / Strategy': 'RBM',
    'TasklistName': '[FCS]',
    '是否创工单': 'Y',
    '工单类型': 'PM10',
    '是否计入AEM': 'Y',
    '备注': ''
  }, overrides || {});
}

function masterRow(fields, strategyId, version) {
  return g.STRATEGY_MASTER_HEADERS.map(function (header) {
    if (header === '策略ID') return strategyId;
    if (header === '版本号') return version;
    if (header === '生效时间') return '2026-11-11 22:15:40';
    if (header === '最后修改人') return '';
    if (header === '最后修改时间') return '';
    return fields[header] === undefined ? '' : fields[header];
  });
}

const recordHeader = [
  '保养策略记录表'
];

const recordSubHeader = ['', '', '', '', '', '', '', '', 'EQU-R-MAC-043-00'];

const recordFieldHeader = [
  '工序 Process',
  '机型 Machine Type',
  '保养频率 PM Frequency',
  '单次停机时间 / h Downtime per PM / h',
  '保养描述 PM Description',
  'RBM保养间隔时间 RBM Maintenance Interval',
  'RBM保养提醒间隔时间 RBM Maintenance Reminder Interval',
  '强制保养频率 / Month Mandatory PM Frequency / Month',
  '策略 Strategy',
  '任务清单名称 TasklistName',
  '是否创工单 Create Work Order?',
  '工单类型 Work Order Type',
  '是否计入AEM Include in AEM?',
  '备注 Remarks'
];

function setup(recordValues) {
  const master = makeSheet([
    g.STRATEGY_MASTER_HEADERS.slice(),
    masterRow(baseFields(), 'PM-MD-0001', '00'),
    masterRow(baseFields({ '工序': 'TF', 'Machine Type': 'UV', 'PM Description': '年度保养' }), 'PM-MD-0002', '00')
  ]);
  const record = makeSheet(recordValues || [
    recordHeader,
    recordSubHeader,
    recordFieldHeader,
    ['STALE', 'STALE', 'STALE', 'STALE', 'STALE', 'STALE', 'STALE', 'STALE', 'STALE', 'STALE', 'STALE', 'STALE', 'STALE', 'STALE'],
    ['STALE2', 'STALE2', 'STALE2', 'STALE2', 'STALE2', 'STALE2', 'STALE2', 'STALE2', 'STALE2', 'STALE2', 'STALE2', 'STALE2', 'STALE2', 'STALE2']
  ]);
  installGas({
    sheetsById: {
      [g.STRATEGY_SS_ID]: {
        [g.STRATEGY_MASTER_SHEET_NAME]: master,
        [g.STRATEGY_RECORD_SHEET_NAME]: record
      }
    },
    sent: []
  });
  return { master: master, record: record };
}

test('refresh 保留标题/表头，从第 4 行写入并按工序/机型排序，清掉旧行', () => {
  const env = setup();
  const res = g.refreshStrategyRecordSheet();
  assert.equal(res.ok, true);
  assert.equal(res.count, 2);
  assert.equal(env.record.values[0][0], '保养策略记录表');
  assert.equal(env.record.values[2][0], '工序 Process');
  assert.equal(env.record.values[3][0], 'IM');
  assert.equal(env.record.values[3][1], 'FCS');
  assert.equal(env.record.values[3][4], '季度保养');
  assert.equal(env.record.values[4][0], 'TF');
  assert.equal(env.record.values[4][1], 'UV');
  assert.equal(env.record.getLastRow(), 5);
});

test('没有记录表时返回失败', () => {
  installGas({
    sheetsById: {
      [g.STRATEGY_SS_ID]: {
        [g.STRATEGY_MASTER_SHEET_NAME]: makeSheet([g.STRATEGY_MASTER_HEADERS.slice()])
      }
    },
    sent: []
  });
  const res = g.refreshStrategyRecordSheet();
  assert.equal(res.ok, false);
  assert.match(res.message, /未找到/);
});
