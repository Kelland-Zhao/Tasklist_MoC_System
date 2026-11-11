import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeSheet, makeUserRow, installGas, loadCode } from './strategy-test-utils.mjs';

const g = loadCode();

let master;
let history;
let sent;

/**
 * 重建 MasterData / History / userID 三个 sheet，并安装 GAS 全局桩。
 * @param {{omitDeptManager?:boolean,omitDocControl?:boolean}} [options]
 * @returns {{master:object, history:object, sent:Array}}
 */
function setupStrategySheets(options) {
  const opts = options || {};
  const masterSheet = makeSheet([g.STRATEGY_MASTER_HEADERS.slice()]);
  const historySheet = makeSheet([g.STRATEGY_HISTORY_HEADERS.slice()]);
  const userRows = [
    [],
    [],
    makeUserRow({ jobNumber:'10001', name:'工序甲', pwd:'*', gmail:'pm.im@colpal.com', process:'IM', auth:'编辑,策略工序经理' }),
  ];
  if (!opts.omitDeptManager) {
    userRows.push(makeUserRow({ jobNumber:'10002', name:'部门乙', pwd:'*', gmail:'dept@colpal.com', process:'ALL', auth:'策略部门经理' }));
  }
  if (!opts.omitDocControl) {
    userRows.push(makeUserRow({ jobNumber:'10003', name:'文控丙', pwd:'*', gmail:'doc@colpal.com', process:'ALL', auth:'作废,发放' }));
  }
  const userSheet = makeSheet(userRows);
  const env = installGas({
    sheetsById: {
      [g.STRATEGY_SS_ID]: {
        [g.STRATEGY_MASTER_SHEET_NAME]: masterSheet,
        [g.STRATEGY_HISTORY_SHEET_NAME]: historySheet,
      },
      [g.STRATEGY_USERID_SS_ID]: { userID: userSheet },
    },
    sent: [],
  });
  return { master: masterSheet, history: historySheet, sent: env.sent };
}

function resetSheets(options) {
  const env = setupStrategySheets(options);
  master = env.master;
  history = env.history;
  sent = env.sent;
  return env;
}

/**
 * 设计文档 2.1 的 14 个业务字段。
 * @returns {Object<string,string>}
 */
function baseFields() {
  return { '工序':'IM','Machine Type':'FCS','PM Frequency':'季','单次停机时间/ h':'8','PM Description':'季度保养','RBM保养间隔时间':'','RBM保养提醒间隔时间':'','强制保养频率/ Month':'3','策略 / Strategy':'RBM','TasklistName':'[FCS]','是否创工单':'Y','工单类型':'PM10','是否计入AEM':'Y','备注':'' };
}

const fields = baseFields();

/**
 * 按 STRATEGY_MASTER_HEADERS 顺序向 MasterData 追加一行。
 * @param {Object<string,*>} obj
 */
function seedMaster(obj) {
  master.appendRow(g.STRATEGY_MASTER_HEADERS.map(function (header) {
    return obj[header] === undefined ? '' : obj[header];
  }));
}

/**
 * 向 History 追加一条在途记录。
 * @param {{operator?:string,process?:string,isVoid?:boolean,strategyId?:string,approver1?:string,content?:Object,submitMail?:string}} [options]
 */
function seedPending(options) {
  const opts = options || {};
  const strategyId = opts.strategyId || '';
  const isVoid = !!opts.isVoid;
  const content = opts.content || (isVoid
    ? { strategyId: strategyId, version: '00', old: { ...baseFields(), version: '00' } }
    : { strategyId: strategyId, version: '01', old: { ...baseFields(), version: '00' }, new: baseFields() });
  const contentFields = content.new || content.old || {};
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
    isVoid ? g.STRATEGY_STATUS.voidPending : g.STRATEGY_STATUS.pending,
    opts.submitMail || 'applicant@colpal.com',
    opts.process || 'IM',
  ]);
}

resetSheets();

test('新建追加 History 并邮件通知工序经理', () => {
  resetSheets();
  const res = g.submitStrategyNew({ jobNumber:'10001', name:'申请人', fields, reason:'新增策略' });
  assert.equal(res.ok, true);
  assert.equal(history.values.length, 2);
  assert.equal(history.values[1][0], 'FCS');
  assert.equal(history.values[1][9], '待审批/ Pending');
  assert.equal(history.values[1][11], 'IM');
  assert.deepEqual(JSON.parse(history.values[1][1]).new, fields);
  assert.equal(sent.at(-1).to, 'pm.im@colpal.com');
});

test('同策略有在途申请时修改被拦下', () => {
  resetSheets();
  seedPending({ operator:'OP-LOCK', process:'IM', strategyId:'PM-MD-0001', isVoid:false });
  const res = g.submitStrategyEdit({ jobNumber:'10001', name:'申请人', strategyId:'PM-MD-0001', old:{...fields, version:'00'}, fields, reason:'修改' });
  assert.equal(res.ok, false);
  assert.match(res.message, /审批中/);
});

test('基线版本不一致时修改被拦下', () => {
  resetSheets();
  seedMaster({ '策略ID':'PM-MD-0001', '版本号':'01', ...fields });
  const res = g.submitStrategyEdit({ jobNumber:'10001', name:'申请人', strategyId:'PM-MD-0001', old:{...fields, version:'00'}, fields, reason:'修改' });
  assert.equal(res.ok, false);
  assert.match(res.message, /已更新/);
});

test('作废单初始状态为作废待审批', () => {
  resetSheets();
  seedMaster({ '策略ID':'PM-MD-0001', '版本号':'00', ...fields });
  const res = g.submitStrategyVoid({ jobNumber:'10003', name:'申请人', strategyId:'PM-MD-0001', old:{...fields, version:'00'}, reason:'停止保养' });
  assert.equal(res.ok, true);
  assert.equal(history.values.at(-1)[9], '作废待审批/ Void Pending');
});

test('缺少部门经理时提交被拦下', () => {
  resetSheets({ omitDeptManager: true });
  const res = g.submitStrategyNew({ jobNumber:'10001', name:'申请人', fields, reason:'新增策略' });
  assert.equal(res.ok, false);
  assert.match(res.message, /审批人未配置/);
  assert.equal(history.values.length, 1);
  assert.equal(sent.length, 0);
});

test('缺少文控时提交被拦下', () => {
  resetSheets({ omitDocControl: true });
  const res = g.submitStrategyNew({ jobNumber:'10001', name:'申请人', fields, reason:'新增策略' });
  assert.equal(res.ok, false);
  assert.match(res.message, /审批人未配置/);
  assert.equal(history.values.length, 1);
  assert.equal(sent.length, 0);
});
