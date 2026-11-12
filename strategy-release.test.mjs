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
 * 向 History 追加一条已生效的基线记录。
 * @param {string} strategyId
 * @param {string} version
 */
function seedEffectiveHistory(strategyId, version) {
  const content = { strategyId: strategyId, version: version, new: baseFields() };
  history.appendRow([
    content.new['Machine Type'],
    JSON.stringify(content),
    'OP-OLD',
    '历史生效',
    '批准/ Approve pm.im@colpal.com 2026-11-01 09:00:00',
    '',
    '批准/ Approve dept@colpal.com 2026-11-01 10:00:00',
    '',
    '发放/ Release doc@colpal.com 2026-11-01 11:00:00',
    g.STRATEGY_STATUS.effective,
    'applicant@colpal.com',
    content.new['工序'],
  ]);
}

/**
 * 向 History 追加一条已作废的基线记录。
 * @param {string} strategyId
 * @param {string} version
 */
function seedVoidedHistory(strategyId, version) {
  const content = { strategyId: strategyId, version: version, new: baseFields() };
  history.appendRow([
    content.new['Machine Type'],
    JSON.stringify(content),
    'OP-VOID',
    '历史作废',
    '',
    '',
    '',
    '',
    '发放/ Release doc@colpal.com 2026-11-02 11:00:00',
    g.STRATEGY_STATUS.void,
    'applicant@colpal.com',
    content.new['工序'],
  ]);
}

/**
 * 向 History 追加一条待文控发放的记录。
 * @param {{operator:string,action:string,strategyId?:string,baseVersion?:string,process?:string,submitMail?:string}} options
 */
function seedWaitRelease(options) {
  const opts = options || {};
  const action = opts.action || 'new';
  const strategyId = opts.strategyId || '';
  const baseVersion = opts.baseVersion === undefined ? '00' : String(opts.baseVersion).padStart(2, '0');
  let content;
  if (action === 'new') {
    content = { strategyId: '', version: '00', new: baseFields() };
  } else if (action === 'void') {
    content = { strategyId: strategyId, version: baseVersion, old: { ...baseFields(), version: baseVersion } };
  } else {
    const baseNumber = parseInt(baseVersion, 10);
    content = {
      strategyId: strategyId,
      version: String((isNaN(baseNumber) ? 0 : baseNumber) + 1).padStart(2, '0'),
      old: { ...baseFields(), version: baseVersion },
      new: baseFields(),
    };
  }
  const contentFields = content.new || content.old;
  history.appendRow([
    contentFields['Machine Type'] || '',
    JSON.stringify(content),
    opts.operator || '',
    '测试申请',
    '批准/ Approve pm.im@colpal.com 2026-11-01 09:00:00',
    '',
    '批准/ Approve dept@colpal.com 2026-11-01 10:00:00',
    '',
    '',
    g.STRATEGY_STATUS.waitRelease,
    opts.submitMail || 'applicant@colpal.com',
    opts.process || 'IM',
  ]);
}

beforeEach(resetSheets);

test('新增发放：生成 PM-MD-0001，版本 00，History 生效', () => {
  seedWaitRelease({ operator:'OP-N', action:'new', process:'IM' });
  const res = g.releaseStrategy({ jobNumber:'10003', name:'文控丙', operator:'OP-N' });
  assert.equal(res.ok, true);
  assert.equal(master.values.length, 2);
  assert.equal(master.values[1][14], 'PM-MD-0001');
  assert.equal(master.values[1][15], '00');
  assert.equal(history.values[1][9], '生效/ Effective');
  assert.match(history.values[1][8], /^批准\/ Approve|^发放/);
  assert.equal(sent.at(-1).to, 'applicant@colpal.com');
  assert.deepEqual((sent.at(-1).cc || '').split(',').sort(), ['dept@colpal.com','pm.im@colpal.com'].sort());
});

test('新增发放不复用 History 中已作废的策略ID', () => {
  seedMaster({ '策略ID':'PM-MD-0001', '版本号':'00', ...fields });
  seedVoidedHistory('PM-MD-0002', '00');
  seedWaitRelease({ operator:'OP-N2', action:'new', process:'IM' });
  const res = g.releaseStrategy({ jobNumber:'10003', name:'文控丙', operator:'OP-N2' });
  assert.equal(res.ok, true);
  assert.equal(res.strategyId, 'PM-MD-0003');
  assert.equal(master.values.length, 3);
  assert.equal(master.values[2][14], 'PM-MD-0003');
});

test('修改发放：版本 +1，上一条生效记录改取代', () => {
  seedMaster({ '策略ID':'PM-MD-0001', '版本号':'00', ...fields });
  seedEffectiveHistory('PM-MD-0001', '00');
  seedWaitRelease({ operator:'OP-E', action:'edit', strategyId:'PM-MD-0001', baseVersion:'00', process:'IM' });
  const res = g.releaseStrategy({ jobNumber:'10003', name:'文控丙', operator:'OP-E' });
  assert.equal(res.ok, true);
  assert.equal(master.values[1][15], '01');
  assert.equal(history.values.find(r => r[9] === '取代/ Replace') !== undefined, true);
});

test('作废发放：删除主表行，History 作废', () => {
  seedMaster({ '策略ID':'PM-MD-0001', '版本号':'00', ...fields });
  seedEffectiveHistory('PM-MD-0001', '00');
  seedWaitRelease({ operator:'OP-V', action:'void', strategyId:'PM-MD-0001', baseVersion:'00', process:'IM' });
  const res = g.releaseStrategy({ jobNumber:'10003', name:'文控丙', operator:'OP-V' });
  assert.equal(res.ok, true);
  assert.equal(master.values.length, 1);
  assert.equal(history.values.at(-1)[9], '作废/ Void');
});

test('版本不一致时中止发放且保持待发放', () => {
  seedMaster({ '策略ID':'PM-MD-0001', '版本号':'01', ...fields });
  seedWaitRelease({ operator:'OP-X', action:'edit', strategyId:'PM-MD-0001', baseVersion:'00', process:'IM' });
  const res = g.releaseStrategy({ jobNumber:'10003', name:'文控丙', operator:'OP-X' });
  assert.equal(res.ok, false);
  assert.equal(history.values.at(-1)[9], '待发放/ Wait for Dissminater');
});

test('文控退回：状态拒绝并解锁', () => {
  seedWaitRelease({ operator:'OP-R', action:'edit', strategyId:'PM-MD-0001', baseVersion:'00', process:'IM' });
  const res = g.returnStrategy({ jobNumber:'10003', name:'文控丙', operator:'OP-R', reason:'信息不全' });
  assert.equal(res.ok, true);
  assert.equal(history.values.at(-1)[9], '拒绝/ Rejected');
});
