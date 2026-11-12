import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeSheet, makeUserRow, installGas, loadCode } from './strategy-test-utils.mjs';

const g = loadCode();

// EQU 保养主数据表 20 列表头（导入只读取第 2 行起的数据）
const EQU_HEADERS = [
  '工序', 'Machine Type', 'PM Frequency', '单次停机时间/ h', 'PM Description',
  'RBM保养间隔时间', 'RBM保养提醒间隔时间', '强制保养频率/ Month', '策略 / Strategy',
  'TasklistName', '是否创工单', '工单类型', '是否计入AEM', '备注',
  '是否确认', '主数据ID', '', '', '最后修改人', '最后修改时间',
];

let master;
let history;
let sent;
let sheetsById;

/**
 * 重建 MasterData / History / userID / EQU MasterData 四个 sheet，并安装 GAS 全局桩。
 * @returns {{master:object, history:object, equ:object, sent:Array}}
 */
function setupStrategySheets() {
  const masterSheet = makeSheet([g.STRATEGY_MASTER_HEADERS.slice()]);
  const historySheet = makeSheet([g.STRATEGY_HISTORY_HEADERS.slice()]);
  const userRows = [
    [],
    [],
    makeUserRow({ jobNumber:'10001', name:'工序甲', pwd:'*', gmail:'pm.im@colpal.com', process:'IM', auth:'编辑,策略工序经理' }),
    makeUserRow({ jobNumber:'10002', name:'部门乙', pwd:'*', gmail:'dept@colpal.com', process:'ALL', auth:'策略部门经理' }),
    makeUserRow({ jobNumber:'10003', name:'文控丙', pwd:'*', gmail:'doc@colpal.com', process:'ALL', auth:'作废,发放' }),
  ];
  const userSheet = makeSheet(userRows);
  const equSheet = makeSheet([EQU_HEADERS.slice()]);
  sheetsById = {
    [g.STRATEGY_SS_ID]: {
      [g.STRATEGY_MASTER_SHEET_NAME]: masterSheet,
      [g.STRATEGY_HISTORY_SHEET_NAME]: historySheet,
    },
    [g.STRATEGY_USERID_SS_ID]: { userID: userSheet },
    [g.STRATEGY_EQU_MASTER_SS_ID]: { [g.STRATEGY_EQU_MASTER_SHEET_NAME]: equSheet },
  };
  const env = installGas({ sheetsById: sheetsById, sent: [] });
  master = masterSheet;
  history = historySheet;
  sent = env.sent;
  return { master: masterSheet, history: historySheet, equ: equSheet, sent: env.sent };
}

/**
 * 用指定数据行重建 EQU MasterData sheet（第 1 行为表头）。
 * 同时重置策略 MasterData / History，保证导入用例从空表开始
 * （队列/计数用例在导入前共享同一份 History 状态）。
 * @param {Array<Array<*>>} rows 20 列数据行
 * @returns {object}
 */
function setupEquMaster(rows) {
  setupStrategySheets();
  const equSheet = makeSheet([EQU_HEADERS.slice()].concat(rows.map(function (row) {
    return row.slice();
  })));
  sheetsById[g.STRATEGY_EQU_MASTER_SS_ID] = { [g.STRATEGY_EQU_MASTER_SHEET_NAME]: equSheet };
  installGas({ sheetsById: sheetsById, sent: sent });
  return equSheet;
}

/**
 * 设计文档 2.1 的 14 个业务字段。
 * @returns {Object<string,string>}
 */
function baseFields() {
  return { '工序':'IM','Machine Type':'FCS','PM Frequency':'季','单次停机时间/ h':'8','PM Description':'季度保养','RBM保养间隔时间':'6','RBM保养提醒间隔时间':'1','强制保养频率/ Month':'3','策略 / Strategy':'RBM','TasklistName':'[FCS]','是否创工单':'Y','工单类型':'PM10','是否计入AEM':'Y','备注':'' };
}

/**
 * 向 History 追加一条在途记录。
 * @param {{operator?:string,process?:string,isVoid?:boolean,strategyId?:string,approver1?:string,submitMail?:string,status?:string}} [options]
 */
function seedPending(options) {
  const opts = options || {};
  const isVoid = !!opts.isVoid;
  const content = isVoid
    ? { strategyId: opts.strategyId || '', version: '00', old: { ...baseFields(), version: '00' } }
    : { strategyId: opts.strategyId || '', version: '01', old: { ...baseFields(), version: '00' }, new: baseFields() };
  const contentFields = content.new || content.old;
  const status = opts.status || (isVoid ? g.STRATEGY_STATUS.voidPending : g.STRATEGY_STATUS.pending);
  history.appendRow([
    contentFields['Machine Type'] || '',
    JSON.stringify(content),
    opts.operator || '',
    '测试申请',
    opts.approver1 || '',
    '',
    '',
    '',
    '',
    status,
    opts.submitMail || 'applicant@colpal.com',
    opts.process || 'IM',
  ]);
}

// 本文件测试按顺序共享同一份 sheet 状态（队列 → 计数 → 导入 → 重复导入拦截）
setupStrategySheets();

test('工序经理队列只含本工序待审单', () => {
  seedPending({ operator:'OP-IM', process:'IM', isVoid:false });
  seedPending({ operator:'OP-TF', process:'TF', isVoid:false });
  const r = g.getStrategyWorkQueue('process', '10001');
  assert.equal(r.rows.length, 1);
  assert.equal(r.rows[0].Process, 'IM');
});

test('待办计数按角色返回', () => {
  const c = g.getStrategyPendingCounts('10001');
  assert.equal(c.process, 1);
});

test('只有工序经理权限：部门与发放计数为 0', () => {
  // 追加一条部门经理待审单和一条待发放单，验证计数不会被其他角色队列污染
  seedPending({ operator:'OP-DEPT', process:'IM', isVoid:false, approver1:'批准/ Approve pm.im@colpal.com 2026-11-11 09:00:00' });
  seedPending({ operator:'OP-REL', process:'IM', isVoid:false, approver1:'批准/ Approve pm.im@colpal.com 2026-11-11 09:00:00', status:g.STRATEGY_STATUS.waitRelease });
  const c = g.getStrategyPendingCounts('10001');
  assert.equal(c.process, 1);
  assert.equal(c.dept, 0);
  assert.equal(c.release, 0);
});

test('只有部门经理权限：工序与发放计数为 0', () => {
  const c = g.getStrategyPendingCounts('10002');
  assert.equal(c.process, 0);
  assert.equal(c.dept, 1);
  assert.equal(c.release, 0);
});

test('只有部门经理权限：工序队列为空', () => {
  const r = g.getStrategyWorkQueue('process', '10002');
  assert.equal(r.rows.length, 0);
  assert.equal(r.user.jobNumber, '10002');
  // 有部门经理权限时部门队列不受影响
  assert.equal(g.getStrategyWorkQueue('dept', '10002').rows.length, 1);
});

test('没有发放权限：发放队列为空', () => {
  const r = g.getStrategyWorkQueue('release', '10002');
  assert.equal(r.rows.length, 0);
  assert.equal(r.user.jobNumber, '10002');
  assert.equal(Array.isArray(r.master), true);
  // 有发放权限的文控仍能看到待发放队列
  assert.equal(g.getStrategyWorkQueue('release', '10003').rows.length, 1);
});

test('导入 2 条 EQU 数据并生成基线 History', () => {
  setupEquMaster([
    ['IM','FCS','季','8','季度保养','','','3','RBM','[FCS]','Y','PM10','Y','','未确认','PM-MD-0001','','','张三','2026-10-01 10:00:00'],
    ['TF','UV','年','4','年度保养','','','12','TBM','[UV]','Y','PM02','NA','','未确认','PM-MD-0002','','','李四','2026-10-02 10:00:00'],
  ]);
  const res = g.importPMStrategyMasterData();
  assert.equal(res.ok, true);
  assert.equal(res.count, 2);
  assert.equal(master.values.length, 3);
  assert.equal(history.values.length, 3);
  assert.equal(history.values[1][9], '生效/ Effective');
  assert.equal(history.values[1][2], '系统导入');
});

test('主表非空时禁止重复导入', () => {
  const res = g.importPMStrategyMasterData();
  assert.equal(res.ok, false);
});

/**
 * 安装指定的策略数据表形态（可省略 MasterData），供导入边界用例使用。
 * @param {{masterSheet?:object,historySheet?:object,equRows?:Array<Array<*>>}} options
 * @returns {{history:object,equ:object,strategySheets:Object}}
 */
function setupImportScenario(options) {
  const opts = options || {};
  const historySheet = opts.historySheet || makeSheet([g.STRATEGY_HISTORY_HEADERS.slice()]);
  const userSheet = makeSheet([
    [],
    [],
    makeUserRow({ jobNumber:'10001', name:'工序甲', pwd:'*', gmail:'pm.im@colpal.com', process:'IM', auth:'编辑,策略工序经理' }),
    makeUserRow({ jobNumber:'10002', name:'部门乙', pwd:'*', gmail:'dept@colpal.com', process:'ALL', auth:'策略部门经理' }),
    makeUserRow({ jobNumber:'10003', name:'文控丙', pwd:'*', gmail:'doc@colpal.com', process:'ALL', auth:'作废,发放' }),
  ]);
  const equSheet = makeSheet([EQU_HEADERS.slice()].concat((opts.equRows || []).map(function (row) {
    return row.slice();
  })));
  const strategySheets = { [g.STRATEGY_HISTORY_SHEET_NAME]: historySheet };
  if (opts.masterSheet) {
    strategySheets[g.STRATEGY_MASTER_SHEET_NAME] = opts.masterSheet;
  }
  sheetsById = {
    [g.STRATEGY_SS_ID]: strategySheets,
    [g.STRATEGY_USERID_SS_ID]: { userID: userSheet },
    [g.STRATEGY_EQU_MASTER_SS_ID]: { [g.STRATEGY_EQU_MASTER_SHEET_NAME]: equSheet },
  };
  const env = installGas({ sheetsById: sheetsById, sent: [] });
  history = historySheet;
  sent = env.sent;
  return { history: historySheet, equ: equSheet, strategySheets: strategySheets };
}

const IMPORT_ROWS = [
  ['IM','FCS','季','8','季度保养','','','3','RBM','[FCS]','Y','PM10','Y','','未确认','PM-MD-0001','','','张三','2026-10-01 10:00:00'],
  ['TF','UV','年','4','年度保养','','','12','TBM','[UV]','Y','PM02','NA','','未确认','PM-MD-0002','','','李四','2026-10-02 10:00:00'],
];

test('MasterData 表不存在时导入自动建表：表头在第 1 行，数据从第 2 行开始', () => {
  setupImportScenario({ equRows: IMPORT_ROWS });
  assert.equal(sheetsById[g.STRATEGY_SS_ID][g.STRATEGY_MASTER_SHEET_NAME], undefined);

  const res = g.importPMStrategyMasterData();
  assert.equal(res.ok, true);
  assert.equal(res.count, 2);

  const created = sheetsById[g.STRATEGY_SS_ID][g.STRATEGY_MASTER_SHEET_NAME];
  assert.ok(created);
  assert.deepEqual(created.values[0], g.STRATEGY_MASTER_HEADERS);
  assert.equal(created.values.length, 3);
  assert.equal(created.values[1][14], 'PM-MD-0001');
  assert.equal(created.values[2][14], 'PM-MD-0002');
  assert.equal(history.values.length, 3);
});

test('MasterData 为空表时导入写入表头，数据从第 2 行开始', () => {
  const emptyMaster = makeSheet([]);
  setupImportScenario({ masterSheet: emptyMaster, equRows: IMPORT_ROWS.slice(0, 1) });

  const res = g.importPMStrategyMasterData();
  assert.equal(res.ok, true);
  assert.equal(res.count, 1);
  assert.deepEqual(emptyMaster.values[0], g.STRATEGY_MASTER_HEADERS);
  assert.equal(emptyMaster.values.length, 2);
  assert.equal(emptyMaster.values[1][14], 'PM-MD-0001');
});

test('MasterData 表头不正确时导入失败且不写入数据', () => {
  const badMaster = makeSheet([['工序', 'Wrong Header']]);
  setupImportScenario({ masterSheet: badMaster, equRows: IMPORT_ROWS.slice(0, 1) });

  const res = g.importPMStrategyMasterData();
  assert.equal(res.ok, false);
  assert.match(res.message, /表头不正确/);
  assert.equal(badMaster.values.length, 1);
});

test('MasterData 已存在数据行时禁止导入', () => {
  const seededMaster = makeSheet([
    g.STRATEGY_MASTER_HEADERS.slice(),
    g.STRATEGY_MASTER_HEADERS.map(function (header) {
      return header === '策略ID' ? 'PM-MD-0001' : '';
    }),
  ]);
  setupImportScenario({ masterSheet: seededMaster, equRows: IMPORT_ROWS.slice(0, 1) });

  const res = g.importPMStrategyMasterData();
  assert.equal(res.ok, false);
  assert.match(res.message, /禁止重复导入/);
  assert.equal(history.values.length, 1);
});

test('History 已有系统导入基线时禁止再次导入', () => {
  const historySheet = makeSheet([g.STRATEGY_HISTORY_HEADERS.slice()]);
  historySheet.appendRow([
    'FCS', '{}', '系统导入', '初始导入', '', '', '', '', '',
    g.STRATEGY_STATUS.effective, '', 'IM',
  ]);
  const emptyMaster = makeSheet([]);
  setupImportScenario({ masterSheet: emptyMaster, historySheet: historySheet, equRows: IMPORT_ROWS.slice(0, 1) });

  const res = g.importPMStrategyMasterData();
  assert.equal(res.ok, false);
  assert.match(res.message, /初始导入/);
});

/**
 * 构造 PM Tasklist_history 的 15 列行：A=MachineType、M=Status、O=Process。
 * @param {string} machineType
 * @param {string} status
 * @param {string} [process]
 * @returns {Array<string>}
 */
function tasklistHistoryRow(machineType, status, process) {
  const row = new Array(15).fill('');
  row[0] = machineType;
  row[12] = status;
  row[14] = process === undefined ? '' : process;
  return row;
}

/**
 * 重建策略数据表并挂载 PM Tasklist_history（含表头行）。
 * @param {Array<Array<string>>} rows 数据行
 * @returns {object} Tasklist_history sheet
 */
function setupTasklistHistory(rows) {
  setupStrategySheets();
  const header = new Array(15).fill('');
  header[0] = 'MachineType';
  header[12] = 'Status';
  header[14] = 'Process';
  const tasklistSheet = makeSheet([header].concat((rows || []).map(function (row) {
    return row.slice();
  })));
  sheetsById[g.STRATEGY_PM_TASKLIST_HISTORY_SS_ID] = {
    [g.STRATEGY_PM_TASKLIST_HISTORY_SHEET_NAME]: tasklistSheet,
  };
  installGas({ sheetsById: sheetsById, sent: sent });
  return tasklistSheet;
}

test('getStrategyTasklistNames 只返回生效清单：去重、trim、按标签升序', () => {
  setupTasklistHistory([
    tasklistHistoryRow('FCS', '生效/ Effective', 'TF'),
    tasklistHistoryRow('  UV  ', '生效/ Effective', 'IM'),
    tasklistHistoryRow('FCS', '生效/ Effective', 'IM'),
    tasklistHistoryRow('ABC', '生效', ''),
    tasklistHistoryRow('IM', 'Effective', ''),
    tasklistHistoryRow('OLD', '取代/ Replace', 'IM'),
    tasklistHistoryRow('VOID', '作废/ Void', 'IM'),
    tasklistHistoryRow('', '生效/ Effective', 'IM'),
    tasklistHistoryRow('   ', '生效/ Effective', 'IM'),
    tasklistHistoryRow('ZZZ', '生效/ Effective', '   '),
    tasklistHistoryRow('3AX', '生效/ Effective', ' IM '),
  ]);

  const res = g.getStrategyTasklistNames();
  assert.equal(res.ok, true);
  assert.deepEqual(res.options, [
    { value: 'ABC', label: 'ABC' },
    { value: 'IM', label: 'IM' },
    { value: '3AX', label: 'IM - 3AX' },
    { value: 'UV', label: 'IM - UV' },
    { value: 'FCS', label: 'TF - FCS' },
    { value: 'ZZZ', label: 'ZZZ' },
  ]);
});

test('getStrategyTasklistNames 同一清单保留第一个非空 Process', () => {
  setupTasklistHistory([
    tasklistHistoryRow('FCS', '生效/ Effective', ''),
    tasklistHistoryRow('FCS', '生效/ Effective', 'TF'),
    tasklistHistoryRow('FCS', '生效/ Effective', 'IM'),
  ]);

  const res = g.getStrategyTasklistNames();
  assert.deepEqual(res.options, [{ value: 'FCS', label: 'TF - FCS' }]);
});

test('getStrategyTasklistNames Process 为空时标签等于清单名', () => {
  setupTasklistHistory([tasklistHistoryRow('FCS', 'Effective', '')]);

  const res = g.getStrategyTasklistNames();
  assert.deepEqual(res.options, [{ value: 'FCS', label: 'FCS' }]);
});

test('getStrategyTasklistNames 表不存在时返回空数组', () => {
  setupStrategySheets();
  sheetsById[g.STRATEGY_PM_TASKLIST_HISTORY_SS_ID] = {};
  installGas({ sheetsById: sheetsById, sent: sent });

  assert.deepEqual(g.getStrategyTasklistNames(), { ok: true, options: [] });
});

test('getStrategyTasklistNames 空表（仅表头）时返回空数组', () => {
  setupTasklistHistory([]);

  assert.deepEqual(g.getStrategyTasklistNames(), { ok: true, options: [] });
});

test('getStrategyTasklistNames 读取异常时返回 ok:false', () => {
  setupStrategySheets();

  const res = g.getStrategyTasklistNames();
  assert.equal(res.ok, false);
  assert.match(res.message, /未配置/);
});
