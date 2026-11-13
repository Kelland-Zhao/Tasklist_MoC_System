import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeSheet, makeUserRow, installGas, loadCode } from './strategy-test-utils.mjs';

const g = loadCode();

let master;
let history;
let sent;

/**
 * 重建 MasterData / History / userID 三个 sheet，并安装 GAS 全局桩。
 * @param {{omitDeptManager?:boolean,omitDocControl?:boolean,extraUsers?:Array}} [options]
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
  (opts.extraUsers || []).forEach(function (user) {
    userRows.push(makeUserRow(user));
  });
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
    opts.status || (isVoid ? g.STRATEGY_STATUS.voidPending : g.STRATEGY_STATUS.pending),
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

test('工序或机型与主表不一致时修改被拦下且不写 History、不发邮件', () => {
  resetSheets({ extraUsers: [
    { jobNumber:'10004', name:'工序丁', pwd:'*', gmail:'pm.tf@colpal.com', process:'TF', auth:'编辑,策略工序经理' },
  ] });
  seedMaster({ '策略ID':'PM-MD-0001', '版本号':'00', ...fields });

  const processRes = g.submitStrategyEdit({
    jobNumber:'10001', name:'申请人', strategyId:'PM-MD-0001',
    old:{ ...fields, version:'00' }, fields:{ ...fields, '工序':'TF' }, reason:'改工序'
  });
  assert.equal(processRes.ok, false);
  assert.match(processRes.message, /工序\/机型不可修改/);

  const machineRes = g.submitStrategyEdit({
    jobNumber:'10001', name:'申请人', strategyId:'PM-MD-0001',
    old:{ ...fields, version:'00' }, fields:{ ...fields, 'Machine Type':'OTHER' }, reason:'改机型'
  });
  assert.equal(machineRes.ok, false);
  assert.match(machineRes.message, /工序\/机型不可修改/);

  assert.equal(history.values.length, 1);
  assert.equal(sent.length, 0);
});

test('作废单初始状态为作废待审批', () => {
  resetSheets();
  seedMaster({ '策略ID':'PM-MD-0001', '版本号':'00', ...fields });
  const res = g.submitStrategyVoid({ jobNumber:'10003', name:'申请人', strategyId:'PM-MD-0001', old:{...fields, version:'00'}, reason:'停止保养' });
  assert.equal(res.ok, true);
  assert.equal(history.values.at(-1)[9], '作废待审批/ Void Pending');
});

test('修改申请以主表数据生成 old 快照，客户端伪造的非关键字段被忽略', () => {
  resetSheets();
  seedMaster({ '策略ID':'PM-MD-0001', '版本号':'00', ...fields });
  const res = g.submitStrategyEdit({
    jobNumber:'10001', name:'申请人', strategyId:'PM-MD-0001',
    old:{ ...fields, version:'00', 'PM Description':'FAKE','PM Frequency':'FAKE-FREQ' },
    fields, reason:'修改'
  });
  assert.equal(res.ok, true);
  const content = JSON.parse(history.values.at(-1)[1]);
  assert.equal(content.old['PM Description'], '季度保养');
  assert.equal(content.old['PM Frequency'], '季');
  assert.equal(content.old.version, '00');
});

test('作废申请以主表数据生成 old 快照，客户端伪造的非关键字段被忽略', () => {
  resetSheets();
  seedMaster({ '策略ID':'PM-MD-0001', '版本号':'00', ...fields });
  const res = g.submitStrategyVoid({
    jobNumber:'10003', name:'文控丙', strategyId:'PM-MD-0001',
    old:{ ...fields, version:'00', 'PM Description':'FAKE' },
    reason:'停止保养'
  });
  assert.equal(res.ok, true);
  const content = JSON.parse(history.values.at(-1)[1]);
  assert.equal(content.old['PM Description'], '季度保养');
  assert.equal(content.old.version, '00');
});

test('导入的必填字段为空的策略可提交作废，发放后删除主表行并置作废', () => {
  resetSheets({ extraUsers: [
    { jobNumber:'10005', name:'工序戊', pwd:'*', gmail:'pm.wh@colpal.com', process:'WH', auth:'策略工序经理' },
  ] });
  seedMaster({
    '策略ID':'PM-MD-0001',
    '版本号':'00',
    '工序':'WH',
    'Machine Type':'缠绕机',
    'PM Frequency':'',
    'PM Description':'',
    '策略 / Strategy':'',
  });

  const submit = g.submitStrategyVoid({
    jobNumber:'10003', name:'文控丙', strategyId:'PM-MD-0001',
    old:{ '工序':'WH', 'Machine Type':'缠绕机', version:'00', 'PM Frequency':'', 'PM Description':'', '策略 / Strategy':'' },
    reason:'设备淘汰'
  });
  assert.equal(submit.ok, true);
  assert.equal(history.values.at(-1)[9], g.STRATEGY_STATUS.voidPending);

  const processApprove = g.saveStrategyApproval({
    jobNumber:'10005', name:'工序戊', operator: submit.operator, level:1, decision:'approve', comment:''
  });
  assert.equal(processApprove.ok, true);
  const deptApprove = g.saveStrategyApproval({
    jobNumber:'10002', name:'部门乙', operator: submit.operator, level:2, decision:'approve', comment:''
  });
  assert.equal(deptApprove.ok, true);
  assert.equal(history.values.at(-1)[9], g.STRATEGY_STATUS.waitRelease);

  const release = g.releaseStrategy({ jobNumber:'10003', name:'文控丙', operator: submit.operator });
  assert.equal(release.ok, true);
  assert.equal(master.values.length, 1);
  assert.equal(history.values.at(-1)[9], g.STRATEGY_STATUS.void);
});

test('作废时工序或机型与主表不一致被拦下且不写 History、不发邮件', () => {
  resetSheets({ extraUsers: [
    { jobNumber:'10004', name:'工序丁', pwd:'*', gmail:'pm.tf@colpal.com', process:'TF', auth:'编辑,策略工序经理' },
  ] });
  seedMaster({ '策略ID':'PM-MD-0001', '版本号':'00', ...fields });

  const processRes = g.submitStrategyVoid({
    jobNumber:'10003', name:'申请人', strategyId:'PM-MD-0001',
    old:{ ...fields, version:'00', '工序':'TF' }, reason:'停止保养'
  });
  assert.equal(processRes.ok, false);
  assert.match(processRes.message, /工序\/机型不可修改/);

  const machineRes = g.submitStrategyVoid({
    jobNumber:'10003', name:'申请人', strategyId:'PM-MD-0001',
    old:{ ...fields, version:'00', 'Machine Type':'OTHER' }, reason:'停止保养'
  });
  assert.equal(machineRes.ok, false);
  assert.match(machineRes.message, /工序\/机型不可修改/);

  assert.equal(history.values.length, 1);
  assert.equal(sent.length, 0);
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

/**
 * 以 baseFields 为基础构造新建申请。
 * @param {Object<string,string>} overrides
 * @returns {{ok:boolean,message?:string,operator?:string}}
 */
function submitNewWith(overrides) {
  return g.submitStrategyNew({
    jobNumber:'10001', name:'申请人',
    fields: { ...fields, ...(overrides || {}) },
    reason:'新增策略'
  });
}

test('缺少单次停机时间时新建被拦下', () => {
  resetSheets();
  const res = submitNewWith({ '单次停机时间/ h': '' });
  assert.equal(res.ok, false);
  assert.match(res.message, /单次停机时间/);
  assert.equal(history.values.length, 1);
  assert.equal(sent.length, 0);
});

test('缺少 TasklistName 时新建被拦下', () => {
  resetSheets();
  const res = submitNewWith({ 'TasklistName': '' });
  assert.equal(res.ok, false);
  assert.match(res.message, /TasklistName/);
});

test('缺少是否创工单时新建被拦下', () => {
  resetSheets();
  const res = submitNewWith({ '是否创工单': '' });
  assert.equal(res.ok, false);
  assert.match(res.message, /是否创工单/);
});

test('缺少是否计入AEM时新建被拦下', () => {
  resetSheets();
  const res = submitNewWith({ '是否计入AEM': '' });
  assert.equal(res.ok, false);
  assert.match(res.message, /是否计入AEM/);
});

test('RBM 缺少保养间隔时间时新建被拦下', () => {
  resetSheets();
  const res = submitNewWith({ 'RBM保养间隔时间': '' });
  assert.equal(res.ok, false);
  assert.match(res.message, /RBM保养间隔时间/);
});

test('RBM 缺少保养提醒间隔时间时新建被拦下', () => {
  resetSheets();
  const res = submitNewWith({ 'RBM保养提醒间隔时间': '' });
  assert.equal(res.ok, false);
  assert.match(res.message, /RBM保养提醒间隔时间/);
});

test('RBM 缺少强制保养频率时新建被拦下', () => {
  resetSheets();
  const res = submitNewWith({ '强制保养频率/ Month': '' });
  assert.equal(res.ok, false);
  assert.match(res.message, /强制保养频率/);
});

test('非 RBM 留空三个 RBM 字段时提交成功并写入 NA 快照', () => {
  resetSheets();
  const input = {
    ...fields,
    '策略 / Strategy': 'TBM',
    'RBM保养间隔时间': '',
    'RBM保养提醒间隔时间': '',
    '强制保养频率/ Month': ''
  };
  const res = g.submitStrategyNew({ jobNumber:'10001', name:'申请人', fields: input, reason:'改为TBM' });
  assert.equal(res.ok, true);
  const content = JSON.parse(history.values.at(-1)[1]);
  assert.equal(content.new['RBM保养间隔时间'], 'NA');
  assert.equal(content.new['RBM保养提醒间隔时间'], 'NA');
  assert.equal(content.new['强制保养频率/ Month'], 'NA');
  assert.equal(input['RBM保养间隔时间'], '', '后端不应修改调用方对象');
});

test('是否创工单 = Y 且缺少工单类型时新建被拦下', () => {
  resetSheets();
  const res = submitNewWith({ '是否创工单': 'Y', '工单类型': '' });
  assert.equal(res.ok, false);
  assert.match(res.message, /工单类型/);
});

test('是否创工单 = N 且工单类型为空时提交成功并写入 NA', () => {
  resetSheets();
  const res = submitNewWith({ '是否创工单': 'N', '工单类型': '' });
  assert.equal(res.ok, true);
  const content = JSON.parse(history.values.at(-1)[1]);
  assert.equal(content.new['工单类型'], 'NA');
});

test('非 RBM 条件字段的 NA 快照在发放时写入 MasterData', () => {
  const env = resetSheets();
  const input = {
    ...fields,
    '策略 / Strategy': 'TBM',
    'RBM保养间隔时间': '',
    'RBM保养提醒间隔时间': '',
    '强制保养频率/ Month': ''
  };
  const submit = g.submitStrategyNew({ jobNumber:'10001', name:'申请人', fields: input, reason:'改为TBM' });
  assert.equal(submit.ok, true);
  const processApprove = g.saveStrategyApproval({
    jobNumber:'10001', name:'工序甲', operator: submit.operator, level:1, decision:'approve', comment:''
  });
  assert.equal(processApprove.ok, true);
  const deptApprove = g.saveStrategyApproval({
    jobNumber:'10002', name:'部门乙', operator: submit.operator, level:2, decision:'approve', comment:''
  });
  assert.equal(deptApprove.ok, true);
  const release = g.releaseStrategy({ jobNumber:'10003', name:'文控丙', operator: submit.operator });
  assert.equal(release.ok, true);
  const row = env.master.values[1];
  ['RBM保养间隔时间', 'RBM保养提醒间隔时间', '强制保养频率/ Month'].forEach(function (key) {
    assert.equal(row[g.STRATEGY_MASTER_HEADERS.indexOf(key)], 'NA', key);
  });
});

test('同工序+机型+描述已有在途新建时再次新建被拦下', () => {
  resetSheets();
  seedPending({
    operator: 'OP-NEW-1',
    process: 'IM',
    content: { strategyId: '', version: '00', new: baseFields() },
  });
  const res = g.submitStrategyNew({ jobNumber:'10001', name:'申请人', fields, reason:'新增策略' });
  assert.equal(res.ok, false);
  assert.match(res.message, /审批中/);
  assert.equal(history.values.length, 2);
});

test('在途新建的描述不同则允许再次新建', () => {
  resetSheets();
  seedPending({
    operator: 'OP-NEW-2',
    process: 'IM',
    content: { strategyId: '', version: '00', new: { ...baseFields(), 'PM Description':'其它描述' } },
  });
  const res = g.submitStrategyNew({ jobNumber:'10001', name:'申请人', fields, reason:'新增策略' });
  assert.equal(res.ok, true);
  assert.equal(history.values.length, 3);
});

test('在途新建为待发放或作废待审批时同样拦截', () => {
  ['待发放/ Wait for Dissminater', '作废待审批/ Void Pending'].forEach(function (status) {
    resetSheets();
    seedPending({
      operator: 'OP-' + status,
      process: 'IM',
      status: status,
      content: { strategyId: '', version: '00', new: baseFields() },
    });
    const res = g.submitStrategyNew({ jobNumber:'10001', name:'申请人', fields, reason:'新增策略' });
    assert.equal(res.ok, false, status);
  });
});

test('在途修改不影响同工序+机型+描述的新建', () => {
  resetSheets();
  seedPending({
    operator: 'OP-EDIT',
    process: 'IM',
    strategyId: 'PM-MD-0001',
    content: { strategyId:'PM-MD-0001', version:'01', old:{ ...baseFields(), version:'00' }, new: baseFields() },
  });
  const res = g.submitStrategyNew({ jobNumber:'10001', name:'申请人', fields, reason:'新增策略' });
  assert.equal(res.ok, true);
});
