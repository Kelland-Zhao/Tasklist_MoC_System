// 机型前导空格导致审批各环节页面查不到待办 —— 回归测试
// 场景：Tasklist_history 行的 MachineType = " 自动模定模年度保养"（带前导空格），
//       Database for Web 配置行 = "自动模定模年度保养"（无空格）。
// 覆盖：审批1 / 审批2 / 班组审批 / 发放 四个页面在「配置行 ↔ 历史行」按机型匹配时需忽略两侧空格。
// 运行：node --test moc-approval-pages-machine-type-trim.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const DIRTY = ' 自动模定模年度保养'; // 历史行：带前导空格
const CLEAN = '自动模定模年度保养';  // 邮件配置行

function extractScript(html) {
  const m = html.match(/<script>([\s\S]*)<\/script>/);
  assert.ok(m, '未找到 <script> 块');
  return m[1];
}

// 执行页面脚本，返回主表实际收到的行
function runApprovalPage(pageFile, historyRow, emailRow, userMail) {
  const src = extractScript(fs.readFileSync(new URL('./' + pageFile, import.meta.url), 'utf8'));
  const added = [];

  const tableStub = {
    clear: () => ({ draw() {} }),
    rows: { add: (rows) => { added.push(...rows); return { draw() {} }; } },
    row: () => ({ data: () => ({}), index: () => 0 }),
    cell: () => ({ data: () => ({ draw() {} }) }),
  };

  const api = {
    ready: (cb) => { cb(); return api; },
    DataTable: () => tableStub,
    text: (v) => (v === undefined ? '任务清单变更管理 - 审批' : api),
    html: () => api,
    on: () => api,
    val: () => '',
    closest: () => api,
    data: () => ({}),
  };
  const $stub = () => api;

  const googleStub = {
    script: {
      run: {
        withSuccessHandler: (handler) => ({
          getApprovaldata: () => handler([[historyRow], [emailRow], userMail, []]),
        }),
      },
    },
  };

  const SwalStub = { fire: () => {}, close: () => {}, showLoading: () => {} };

  new Function('$', 'google', 'Swal', 'document', src)($stub, googleStub, SwalStub, {});
  return added;
}

const emailRow = {
  MachineType: CLEAN,
  Process: 'IM',
  Mail_Approve1: 'frank_shen_shen@colpal.com',
  Mail_Approve2: 'kelland_zhao@colpal.com',
  Mail_Disseninate: 'yue_cao@colpal.com',
  Mail_CC: 'tommy_xu@colpal.com',
  Mail_Production: 'janus_xu@colpal.com',
};

function baseHistoryRow(overrides) {
  return Object.assign({
    MachineType: DIRTY,
    Operator: '工号/ JobNumber:  33677_姓名/ Name:  林飞 2026-11-06 11:25:12',
    Reason: '变更原因/ Reason for change: 测试',
    'Production Approval (Y/N)': 'N',
    'Production Approver': '',
    'Production Comment': '',
    Approver1: '',
    Comment1: '',
    Approver2: '',
    Comment2: '',
    Dissminater: '',
    Status: '待审批/ Pending',
    submitMail: 'fei_lin@colpal.com',
    Tasklist: '[]',
  }, overrides);
}

test('审批1页：机型带前导空格的待审批记录应出现在列表中', () => {
  const added = runApprovalPage(
    'Tasklist_Approval1_JS.html',
    baseHistoryRow({}),
    emailRow,
    'frank_shen_shen@colpal.com'
  );
  assert.equal(added.length, 1);
  assert.equal(added[0].MachineType, DIRTY);
});

test('审批2页：机型带前导空格的记录应出现在列表中', () => {
  const added = runApprovalPage(
    'Tasklist_Approval2_JS.html',
    baseHistoryRow({ Approver1: '批准/ Approve frank_shen_shen@colpal.com 2026-11-10 10:00:00' }),
    emailRow,
    'kelland_zhao@colpal.com'
  );
  assert.equal(added.length, 1);
});

test('班组审批页：机型带前导空格的记录应出现在列表中', () => {
  const added = runApprovalPage(
    'Tasklist_Production_Approval_JS.html',
    baseHistoryRow({ 'Production Approval (Y/N)': 'Y' }),
    emailRow,
    'janus_xu@colpal.com'
  );
  assert.equal(added.length, 1);
});

test('发放页：机型带前导空格的记录应出现在列表中', () => {
  const added = runApprovalPage(
    'Tasklist_Dissminater_JS.html',
    baseHistoryRow({ Approver2: '批准/ Approve kelland_zhao@colpal.com 2026-11-10 10:00:00' }),
    emailRow,
    'yue_cao@colpal.com'
  );
  assert.equal(added.length, 1);
});
