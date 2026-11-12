import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { makeSheet, makeUserRow, installGas, loadCode } from './strategy-test-utils.mjs';

const g = loadCode();

let master;
let history;
let sent;

/**
 * 重建 MasterData / History / userID 三个 sheet，并安装 GAS 全局桩。
 * @returns {{master:object, history:object, sent:Array}}
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

function resetSheets() {
  const env = setupStrategySheets();
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
  return { '工序':'IM','Machine Type':'FCS','PM Frequency':'季','单次停机时间/ h':'8','PM Description':'季度保养','RBM保养间隔时间':'6','RBM保养提醒间隔时间':'1','强制保养频率/ Month':'3','策略 / Strategy':'RBM','TasklistName':'[FCS]','是否创工单':'Y','工单类型':'PM10','是否计入AEM':'Y','备注':'' };
}

/**
 * 向 History 追加一条在途记录。
 * @param {{operator?:string,process?:string,isVoid?:boolean,strategyId?:string,approver1?:string,submitMail?:string}} [options]
 */
function seedPending(options) {
  const opts = options || {};
  const isVoid = !!opts.isVoid;
  const content = isVoid
    ? { strategyId: opts.strategyId || '', version: '00', old: { ...baseFields(), version: '00' } }
    : { strategyId: opts.strategyId || '', version: '01', old: { ...baseFields(), version: '00' }, new: baseFields() };
  const contentFields = content.new || content.old;
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

beforeEach(resetSheets);

test('工序经理批准：写 Approver1，状态保持待审批，通知申请人+部门经理', () => {
  seedPending({ operator:'OP-1', process:'IM', isVoid:false });
  const res = g.saveStrategyApproval({ jobNumber:'10001', name:'工序甲', operator:'OP-1', level:1, decision:'approve', comment:'同意' });
  assert.equal(res.ok, true);
  assert.match(history.values[1][4], /^批准\/ Approve/);
  assert.equal(history.values[1][5], '同意');
  assert.equal(history.values[1][9], '待审批/ Pending');
  assert.deepEqual(sent.map(m => m.to).sort(), ['applicant@colpal.com','dept@colpal.com'].sort());
  sent.forEach(m => assert.equal(m.cc, ''));
});

test('部门经理批准：状态转待发放，通知申请人+文控', () => {
  seedPending({ operator:'OP-2', process:'IM', isVoid:false, approver1:'批准/ Approve pm.im@colpal.com 2026-11-11 09:00:00' });
  const res = g.saveStrategyApproval({ jobNumber:'10002', name:'部门乙', operator:'OP-2', level:2, decision:'approve', comment:'' });
  assert.equal(res.ok, true);
  assert.equal(history.values[1][9], '待发放/ Wait for Dissminater');
  assert.deepEqual(sent.map(m => m.to).sort(), ['applicant@colpal.com','doc@colpal.com'].sort());
  sent.forEach(m => assert.equal(m.cc, 'pm.im@colpal.com'));
});

test('工序经理不能审批其他工序的单', () => {
  seedPending({ operator:'OP-3', process:'TF', isVoid:false });
  const res = g.saveStrategyApproval({ jobNumber:'10001', name:'工序甲', operator:'OP-3', level:1, decision:'approve', comment:'' });
  assert.equal(res.ok, false);
});

test('任一节点拒绝：状态置拒绝并通知申请人', () => {
  seedPending({ operator:'OP-4', process:'IM', isVoid:false });
  const res = g.saveStrategyApproval({ jobNumber:'10001', name:'工序甲', operator:'OP-4', level:1, decision:'reject', comment:'不符合要求' });
  assert.equal(res.ok, true);
  assert.equal(history.values[1][9], '拒绝/ Rejected');
  assert.equal(sent.at(-1).to, 'applicant@colpal.com');
  assert.equal(sent.at(-1).cc, '');
});

test('部门经理拒绝：状态置拒绝，通知申请人并抄送工序经理', () => {
  seedPending({ operator:'OP-5', process:'IM', isVoid:false, approver1:'批准/ Approve pm.im@colpal.com 2026-11-11 09:00:00' });
  const res = g.saveStrategyApproval({ jobNumber:'10002', name:'部门乙', operator:'OP-5', level:2, decision:'reject', comment:'不通过' });
  assert.equal(res.ok, true);
  assert.equal(history.values[1][9], '拒绝/ Rejected');
  assert.deepEqual(sent.map(m => m.to), ['applicant@colpal.com']);
  assert.equal(sent[0].cc, 'pm.im@colpal.com');
});

test('允许自审批', () => {
  seedPending({ operator:'OP-SELF', process:'IM', isVoid:false, submitMail:'pm.im@colpal.com' });
  const res = g.saveStrategyApproval({ jobNumber:'10001', name:'工序甲', operator:'OP-SELF', level:1, decision:'approve', comment:'' });
  assert.equal(res.ok, true);
});
