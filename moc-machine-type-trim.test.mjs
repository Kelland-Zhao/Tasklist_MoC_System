// 机型值前导空格导致审批人显示为空 —— 回归测试
// 场景：Tasklist_history 某行 MachineType 为 " 自动模定模年度保养"（带前导空格），
//       而 Database for Web 配置为 "自动模定模年度保养"（无空格）。
// 覆盖：① 进度页 getApproverEmail 需 trim 后匹配；② 后端 dataSave 写入历史表前需 trim。
// 运行：node --test moc-machine-type-trim.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// 从 HTML 中提取指定函数源码（大括号配平）
function extractFunction(src, name) {
  const start = src.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `未找到 function ${name}`);
  let depth = 0;
  for (let i = src.indexOf('{', start); i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error(`function ${name} 大括号不平衡`);
}

// ===== ① 进度页：带空格的机型也要能匹配到审批人 =====
const progressSrc = fs.readFileSync(new URL('./Tasklist_Progress_JS.html', import.meta.url), 'utf8');
const getApproverEmail = new Function(
  'emailConfig',
  `${extractFunction(progressSrc, 'getApproverEmail')}; return getApproverEmail;`
)([
  { MachineType: '自动模定模年度保养', Mail_Approve1: 'frank_shen_shen@colpal.com', Mail_Approve2: 'kelland_zhao@colpal.com' },
  { MachineType: ' HSL', Mail_Approve1: 'kevin_li_liu@colpal.com' },
]);

test('进度页：历史行机型带前导空格，仍能取到审1审批人邮箱', () => {
  assert.equal(getApproverEmail(' 自动模定模年度保养', 'lv1'), 'frank_shen_shen@colpal.com');
});

test('进度页：配置表机型带空格（两端），同样可匹配', () => {
  assert.equal(getApproverEmail('HSL', 'lv1'), 'kevin_li_liu@colpal.com');
});

// ===== ② 后端：dataSave 写入历史表的机型需 trim =====
const code = fs.readFileSync(new URL('./Code.js', import.meta.url), 'utf8');

const SHEET_ID = '1bYKTK5a63yJWRHzM_UPP6b4hwF67eZKEM5dCKLWR59U';
let historyRows = [];
let sentMails = [];

const historySheet = {
  appendRow: (row) => historyRows.push(row),
};
const mailSheet = {
  getLastRow: () => 2,
  getLastColumn: () => 7,
  getRange: () => ({
    getValues: () => [[
      '自动模定模年度保养', 'IM', 'frank_shen_shen@colpal.com',
      'kelland_zhao@colpal.com', 'yue_cao@colpal.com', 'tommy_xu@colpal.com',
      'janus_xu@colpal.com',
    ]],
  }),
};

globalThis.SpreadsheetApp = {
  openById: (id) => ({
    getSheetByName: (n) => (n === 'Tasklist_history' ? historySheet : mailSheet),
  }),
};
globalThis.GmailApp = { sendEmail: (...args) => sentMails.push(args) };
globalThis.Session = { getActiveUser: () => ({ getEmail: () => 'fei_lin@colpal.com' }) };

(0, eval)(code);

test('dataSave：Tasklist JSON 里机型带前导空格时，写入历史表的机型列需去空格', () => {
  historyRows = [];
  sentMails = [];
  const tasklist = [
    { MachineType: ' 自动模定模年度保养', 'Task No': ' 自动模定模年度保养-01' },
    { MachineType: ' 自动模定模年度保养', 'Task No': ' 自动模定模年度保养-02' },
  ];

  const ok = globalThis.dataSave(
    JSON.stringify(tasklist),
    '工号/ JobNumber:  33677_姓名/ Name:  林飞 2026-11-06 11:25:12',
    '变更原因/ Reason for change: 测试 修改条目数/ Number of edit: 1 新增条目数/ Number of add: 1 删除条目数/ Number of delete: 0',
    '待审批/ Pending',
    'fei_lin@colpal.com',
    'IM',
    false
  );

  assert.equal(ok, true);
  assert.equal(historyRows.length, 1);
  assert.equal(historyRows[0][0], '自动模定模年度保养');
  // 审1 邮件仍应发给 factory 配置中的审批人
  assert.equal(sentMails[0][0], 'frank_shen_shen@colpal.com');
});
