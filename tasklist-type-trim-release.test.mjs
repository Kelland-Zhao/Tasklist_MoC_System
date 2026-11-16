import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode, installGas, makeSheet } from './strategy-test-utils.mjs';

const g = loadCode();

const PM_DB = '1bYKTK5a63yJWRHzM_UPP6b4hwF67eZKEM5dCKLWR59U';
const IN_DB = '1RQql-PrcBWiAQNeg7hQKcocpllSUMRhT5XPrDTVWoBY';

const HISTORY_HEADER = [
  'MachineType', 'Tasklist', 'Operator', 'Reason', 'Production Approver', 'Production Comment',
  'Approver1', 'Comment1', 'Approver2', 'Comment2', 'Production Approval (Y/N)',
  'Dissminater', 'Status', 'submitMail', 'Process',
];

const WEB_HEADER = [
  'MachineType', 'Process', 'Mail_Approve1', 'Mail_Approve2', 'Mail_Disseninate', 'Mail_CC', 'Mail_Production',
];

function fakeSheet(values) {
  function readBlock(startRow, startCol, numRows, numCols) {
    const out = [];
    for (let r = 0; r < numRows; r++) {
      const source = values[startRow - 1 + r] || [];
      const row = [];
      for (let c = 0; c < numCols; c++) {
        const value = source[startCol - 1 + c];
        row.push(value === undefined || value === null ? '' : value);
      }
      out.push(row);
    }
    return out;
  }

  function getRange(a, b, c, d) {
    return {
      getValues() {
        if (typeof a === 'string' && /^[A-Z]:[A-Z]$/.test(a)) {
          const colIndex = a.charCodeAt(0) - 65;
          return values.map((row) => [row[colIndex] === undefined ? '' : row[colIndex]]);
        }
        if (b === undefined) return [[values[a - 1] ? values[a - 1][0] : '']];
        return readBlock(a, b, c, d);
      },
      setValue(value) {
        while (values.length < a) values.push([]);
        if (!values[a - 1]) values[a - 1] = [];
        values[a - 1][b - 1] = value;
      },
    };
  }

  return {
    values,
    getRange,
    getLastRow: () => {
      for (let r = values.length - 1; r >= 0; r--) {
        if ((values[r] || []).some((v) => v !== '' && v !== null && v !== undefined)) return r + 1;
      }
      return 0;
    },
    getLastColumn: () => {
      let last = 0;
      values.forEach((row) => { if ((row || []).length > last) last = row.length; });
      return last;
    },
    getSheetValues: (startRow, startCol, numRows, numCols) => readBlock(startRow, startCol, numRows, numCols),
    appendRow: (row) => { values.push(row.slice()); },
  };
}

function setupRelease(dbId, historyValues) {
  const history = fakeSheet(historyValues);
  const web = makeSheet([
    WEB_HEADER,
    ['6AX', 'IM', 'a1@colpal.com', 'a2@colpal.com', 'doc@colpal.com', '', 'prod@colpal.com'],
  ]);
  const env = installGas({
    sheetsById: { [dbId]: { Tasklist_history: history, 'Database for Web': web } },
    sent: [],
  });
  return { history, env };
}

function historyRow(machineType, operator, status) {
  return [machineType, '[]', operator, '测试', '', '', '', '', '', '', 'N', '', status, 'tester@colpal.com', 'IM'];
}

test('发放：旧生效行机型带空格也能被标记取代，并写回 trim 后的机型', () => {
  const ctx = setupRelease(PM_DB, [
    HISTORY_HEADER,
    historyRow('6AX', 'OLD_OPERATOR', '生效/ Effective'),
    historyRow(' 6AX ', 'REQ_OPERATOR', '待发放/ Wait for Dissminater'),
  ]);

  const res = g.saveDissminater([
    'REQ_OPERATOR', '批准/ Approve', 'submit@colpal.com', 'a1@colpal.com', ' 6AX ',
    '变更原因', 'doc@colpal.com', 'a2@colpal.com', '', 'prod@colpal.com', '2026-11-16',
  ]);

  assert.equal(res, true);
  assert.equal(ctx.history.values[1][12], '取代/ Replace');
  assert.equal(ctx.history.values[2][12], '生效/ Effective');
  assert.equal(ctx.history.values[2][0], '6AX');
});

test('点检发放：旧生效行机型带空格也能被标记取代', () => {
  const ctx = setupRelease(IN_DB, [
    HISTORY_HEADER,
    historyRow('6AX', 'OLD_OPERATOR', '生效/ Effective'),
    historyRow(' 6AX ', 'REQ_OPERATOR', '待发放/ Wait for Dissminater'),
  ]);

  const res = g.saveDissminater_IN([
    'REQ_OPERATOR', '批准/ Approve', 'submit@colpal.com', 'a1@colpal.com', ' 6AX ',
    '变更原因', 'doc@colpal.com', 'a2@colpal.com', '', '2026-11-16',
  ]);

  assert.equal(res, true);
  assert.equal(ctx.history.values[1][12], '取代/ Replace');
  assert.equal(ctx.history.values[2][0], '6AX');
});

function setupSubmit(dbId) {
  const history = makeSheet([HISTORY_HEADER]);
  const web = makeSheet([
    WEB_HEADER,
    ['6AX', 'IM', 'a1@colpal.com', 'a2@colpal.com', 'doc@colpal.com', '', 'prod@colpal.com'],
  ]);
  const env = installGas({
    sheetsById: { [dbId]: { Tasklist_history: history, 'Database for Web': web } },
    sent: [],
  });
  return { history, env };
}

function submitPayload(machineType, inMode) {
  const basic = {
    MachineType: machineType,
    Process: 'IM',
    Mail_Approve1: 'a1@colpal.com',
    Mail_Approve2: 'a2@colpal.com',
    Mail_Disseninate: 'doc@colpal.com',
    Mail_CC: '',
    Mail_production_Approval: 'prod@colpal.com',
    judge_Production_Approval: 'N',
  };
  const data = [machineType, '[]', '10001/ 申请人 2026-11-16', '新建/ New', '待审批/ Pending'];
  if (!inMode) return [basic, data, 'IM'];
  data.push('IM');
  return [basic, data];
}

test('保养新建：写入历史前 trim 机型', () => {
  const ctx = setupSubmit(PM_DB);
  const res = g.submitRequest(submitPayload(' 6AX ', false));
  assert.equal(res, true);
  assert.equal(ctx.history.values[1][0], '6AX');
});

test('点检新建：写入历史前 trim 机型', () => {
  const ctx = setupSubmit(IN_DB);
  const res = g.submitRequest_IN(submitPayload(' 6AX ', true));
  assert.equal(res, true);
  assert.equal(ctx.history.values[1][0], '6AX');
});

test('点检修改/作废：写入历史前 trim 机型', () => {
  const ctx = setupSubmit(IN_DB);
  const res = g.dataSave_IN(
    JSON.stringify([{ 'Machine Type': ' 6AX ' }]),
    '10001/ 申请人 2026-11-16',
    '修改',
    '待审批/ Pending',
    'tester@colpal.com',
    'IM',
    false
  );
  assert.equal(res, true);
  assert.equal(ctx.history.values[1][0], '6AX');
});
