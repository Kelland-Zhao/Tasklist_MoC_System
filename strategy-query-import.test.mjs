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
  return { '工序':'IM','Machine Type':'FCS','PM Frequency':'季','单次停机时间/ h':'8','PM Description':'季度保养','RBM保养间隔时间':'','RBM保养提醒间隔时间':'','强制保养频率/ Month':'3','策略 / Strategy':'RBM','TasklistName':'[FCS]','是否创工单':'Y','工单类型':'PM10','是否计入AEM':'Y','备注':'' };
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
