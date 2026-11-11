# 保养策略审批（PM Strategy Approval）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 Tasklist MoC 内新增保养策略的新建、修改、作废与三级审批（工序经理 → 部门经理 → 文控发放），替代 EQU 现有的单人确认。

**Architecture:** 新主表 `MasterData` 只保存当前有效版本；`History` 追加式保存每次申请与审批；Code.js 新增 `strategy*` 后端函数；前端 8 个页面复用现有导航、DataTables、SweetAlert 与 userID 权限体系。

**Tech Stack:** Google Apps Script (V8), HtmlService, Bootstrap 5.3.1, jQuery 3.6.4, DataTables 1.13.6, SweetAlert2, Node `node --test` 回归测试。

**Spec:** `docs/superpowers/specs/2026-11-11-pm-strategy-approval-design.md`

## Global Constraints

- Web App：`USER_ACCESSING`，访问域 `colpal.com`，时区 `Asia/Shanghai`。
- 权限只读 `userID`：AY 权限（索引 50）、AX 工序（索引 49）、J 邮箱（索引 9）；不新增权限表。
- 主表只保留当前有效版本；History 只追加，历史内容不改写（状态流转除外）。
- 所有页面遵循 `docs/UI规范.md`：双语中上英下、红底表头、SweetAlert 规范、按钮图标化。
- 文件命名：`Strategy_*.html` + `Strategy_*_JS.html`；页面用 `<?!=include("...")?>` 引入。
- 测试命令：`node --test <file>.test.mjs`；语法检查：`node --check Code.js`。
- 提交信息格式：`VYYYYMMDD.XX_描述`，`XX` 为跨天连续序号；执行前用 `git log --oneline` 查最新号再递增。
- 现有未提交的机型 trim 修复不属于本计划；开始前先单独处理（提交或暂存），本计划的提交不得混入这些文件。
- 不修改现有 Tasklist / Inspection 流程。

## Review Focus

1. **版本漂移**：主表版本在页面打开后变化 → 旧值覆盖新版本；提交与发放都必须比对 `old.version`，测试放在 Task 3 / Task 5。
2. **角色/工序越权**：工序经理只能看/批本工序；部门经理全工序；不匹配必须拒绝。测试放在 Task 2 / Task 4。
3. **邮件断链**：漏发部门经理或文控 → 流程停摆；每个节点收件人/CC 都要有断言。测试放在 Task 3 / Task 4 / Task 5。
4. **发放失败锁死**：卡在 `待发放` 的策略永久无法再申请；文控退回必须解锁。测试放在 Task 5。
5. **导入顺序/重复**：先开放页面再导入会生成低号或让主表非空；重复导入必须被拒。测试放在 Task 6。

## File Structure

新增：

- `Strategy_Common_JS.html`：14 字段定义、差异比较、状态徽章、频率换算、通用格式化。
- `Strategy_Create.html` / `Strategy_Create_JS.html`：新建策略。
- `Strategy_Modify.html` / `Strategy_Modify_JS.html`：修改策略。
- `Strategy_Void.html` / `Strategy_Void_JS.html`：作废策略。
- `Strategy_Approval_JS.html`：工序经理/部门经理共用的审批逻辑。
- `Strategy_Approval1.html` / `Strategy_Approval1_JS.html`：工序经理审批。
- `Strategy_Approval2.html` / `Strategy_Approval2_JS.html`：部门经理审批。
- `Strategy_Release.html` / `Strategy_Release_JS.html`：文控发放/退回。
- `Strategy_Progress.html` / `Strategy_Progress_JS.html`：申请进度。
- `Strategy_Viewer.html` / `Strategy_Viewer_JS.html`：当前策略与版本历史查阅。
- `strategy-test-utils.mjs` + `strategy-*.test.mjs`：Node 回归测试。

修改：

- `Code.js`：新增常量/后端函数；扩展 `getPasswordData`；新增 8 条路由与页面标题。
- `Tasklist_Home.html`：新增「保养策略」页签与 8 张卡。
- `Tasklist_Home_JS.html`：PAGE_MAP、策略待办徽章、空权限提示。
- `docs/说明文档.md`、`项目记录.md`：功能说明与实施记录。

## 测试夹具

所有测试文件开头统一导入 `fs`, `node:test`, `node:assert/strict`，并从 `strategy-test-utils.mjs` 引入所需 helper。后端测试共用 `strategy-test-utils.mjs`，并在测试文件内定义以下夹具：

- `setupStrategySheets()`：重建 `MasterData` / `History` / `userID` 三个 sheet，返回 `{master, history, sent}`。
- `baseFields()`：返回设计文档中的 14 个业务字段对象（`工序='IM'`, `Machine Type='FCS'`, `PM Description='季度保养'`, `策略 / Strategy='RBM'` 等）。
- `seedMaster(obj)`：按 `STRATEGY_MASTER_HEADERS` 顺序向 `MasterData` 追加一行。
- `seedPending({operator,process,isVoid,strategyId,approver1,content,submitMail})`：向 `History` 追加一条 `待审批` 或 `作废待审批` 记录，`submitMail` 默认 `applicant@colpal.com`。
- `seedEffectiveHistory(strategyId,version)`：追加一条 `生效/ Effective` 基线记录。
- `seedWaitRelease({operator,action,strategyId,baseVersion,process,submitMail})`：追加一条 `待发放` 记录，`Strategy Content` 按 action 组装。
- `setupEquMaster(rows)`：设置 EQU MasterData 的假数据。

---

### Task 1: 测试工具与后端纯函数

**Files:**
- Create: `strategy-test-utils.mjs`
- Modify: `Code.js`（文件末尾新增 `// ===== 保养策略审批 =====` 区块）
- Test: `strategy-core.test.mjs`

**Interfaces:**
- Consumes: 无。
- Produces:
  - `strategy-test-utils.mjs`：`makeSheet(values)`, `installGas({sheetsById, sent})`, `loadCode()`, `makeUserRow({jobNumber,name,pwd,gmail,process,auth})`, `extractFunction(src,name)`, `extractScript(html)`, `makeJQueryStub(values)`。
  - Code.js 常量：`STRATEGY_SS_ID`, `STRATEGY_MASTER_SHEET_NAME`, `STRATEGY_HISTORY_SHEET_NAME`, `STRATEGY_USERID_SS_ID`, `STRATEGY_EQU_MASTER_SS_ID`, `STRATEGY_BUSINESS_FIELDS`（14 项，顺序同设计文档）, `STRATEGY_MASTER_HEADERS`（19 列）, `STRATEGY_HISTORY_HEADERS`（12 列）, `STRATEGY_STATUS`。
  - 纯函数：`strategyDisplayId_(strategyId, version)`, `strategyAction_(content)`, `normalizeStrategyVersion_(value)`, `nextStrategyId_(existingIds)`, `strategyRowToObject_(headers,row)`。

- [ ] **Step 1: 写失败测试**

`strategy-core.test.mjs`：

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from './strategy-test-utils.mjs';

const g = loadCode();

test('strategyAction_ 根据 old/new 推断', () => {
  assert.equal(g.strategyAction_({ new: {} }), 'new');
  assert.equal(g.strategyAction_({ old: {} }), 'void');
  assert.equal(g.strategyAction_({ old: {}, new: {} }), 'edit');
});

test('strategyDisplayId_ 拼接两位版本号', () => {
  assert.equal(g.strategyDisplayId_('PM-MD-0001', '1'), 'PM-MD-0001-01');
  assert.equal(g.strategyDisplayId_('PM-MD-0001', '00'), 'PM-MD-0001-00');
});

test('normalizeStrategyVersion_ 两位补零', () => {
  assert.equal(g.normalizeStrategyVersion_(1), '01');
  assert.equal(g.normalizeStrategyVersion_('00'), '00');
});

test('nextStrategyId_ 取最大号加一', () => {
  assert.equal(g.nextStrategyId_(['PM-MD-0001', 'PM-MD-0080']), 'PM-MD-0081');
  assert.equal(g.nextStrategyId_([]), 'PM-MD-0001');
});
```

- [ ] **Step 2: 运行确认失败**

Run: `node --test strategy-core.test.mjs`
Expected: FAIL（`strategy-test-utils.mjs` 不存在）

- [ ] **Step 3: 实现测试工具与常量/纯函数**

`strategy-test-utils.mjs` 的 `makeSheet` 至少实现：`getLastRow`, `getLastColumn`, `getRange(row,col,nRows,nCols)`（含 `getValues`/`getDisplayValues`/`setValues`/`setValue`）、`getSheetValues`, `appendRow`, `deleteRow`。`installGas` 设置 `globalThis.SpreadsheetApp.openById(id).getSheetByName(name)`、`GmailApp.sendEmail(to,subject,body,options)` 捕获为 `{to,subject,htmlBody,cc}` 到 `sent`、`Session.getActiveUser().getEmail()`、`Utilities.formatDate` 返回固定 `'2026-11-11 10:00:00'`。

Code.js 常量严格照设计文档第 2 节；`normalizeStrategyVersion_` 空值返回 `''`，否则 `String(value).trim().padStart(2,'0')`；`nextStrategyId_` 匹配 `/^PM-MD-(\d+)$/` 取最大数字 + 1，四位补零。

- [ ] **Step 4: 运行确认通过**

Run: `node --test strategy-core.test.mjs`
Expected: PASS 4 tests

- [ ] **Step 5: 提交**

```bash
git add Code.js strategy-test-utils.mjs strategy-core.test.mjs
git commit -m "V20261111.XX_保养策略审批_后端常量与测试工具"
```

---

### Task 2: userID 权限与审批人解析

**Files:**
- Modify: `Code.js:1692-1714`（`getPasswordData`）
- Modify: `Code.js`（strategy 区块新增权限 helper）
- Test: `strategy-users.test.mjs`

**Interfaces:**
- Consumes: Task 1 的 `makeSheet`/`installGas`/`loadCode`。
- Produces:
  - `getPasswordData()` 返回的用户对象新增 `Process`（索引 49）与 `Email`（索引 9），原有字段不变。
  - `getStrategyUsers_()` → `User[]`，`User = {jobNumber,name,pwd,authorization,process,email}`。
  - `getStrategyUserByJobNumber_(jobNumber)` → `User|null`。
  - `strategyHasPermission_(user, token)` → `boolean`。
  - `strategyProcessMatches_(user, process)` → `boolean`（`ALL` 匹配任意工序）。
  - `getStrategyApprovers_(process)` → `{processManager, deptManager, docControl}`，每项 `{name,email}|null`。

- [ ] **Step 1: 写失败测试**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeSheet, makeUserRow, installGas, loadCode } from './strategy-test-utils.mjs';

const users = makeSheet([
  [], [],
  makeUserRow({ jobNumber:'10001', name:'工序甲', pwd:'*', gmail:'pm.im@colpal.com', process:'IM', auth:'编辑,策略工序经理' }),
  makeUserRow({ jobNumber:'10002', name:'部门乙', pwd:'*', gmail:'dept@colpal.com', process:'ALL', auth:'策略部门经理' }),
  makeUserRow({ jobNumber:'10003', name:'文控丙', pwd:'*', gmail:'doc@colpal.com', process:'ALL', auth:'发放' }),
]);
installGas({ sheetsById: { '1F7G3WOY5xM4fEYZ1s5RKulY4kJhqCZ9HefthmiVkraM': { userID: users } }, sent: [] });
const g = loadCode();

test('按工序解析工序经理', () => {
  const a = g.getStrategyApprovers_('IM');
  assert.equal(a.processManager.email, 'pm.im@colpal.com');
  assert.equal(a.deptManager.email, 'dept@colpal.com');
  assert.equal(a.docControl.email, 'doc@colpal.com');
});

test('工序无经理时返回 null', () => {
  assert.equal(g.getStrategyApprovers_('TF').processManager, null);
});

test('getPasswordData 带出 Process 与 Email', () => {
  const [rows] = g.getPasswordData();
  const user = rows.find(r => String(r.JobNumber).trim() === '10001');
  assert.equal(user.Process, 'IM');
  assert.equal(user.Email, 'pm.im@colpal.com');
});
```

- [ ] **Step 2: 运行确认失败**

Run: `node --test strategy-users.test.mjs`
Expected: FAIL（`getStrategyApprovers_` 未定义）

- [ ] **Step 3: 实现权限 helper 并扩展 `getPasswordData`**

在 `getPasswordData` 的 `objData` 中追加 `objData.Process = r[49]; objData.Email = r[9];`。`getStrategyUsers_` 读取 `userID` 第 3 行到末行，映射 A/B/C/J/AX/AY/AD（邮箱取 J，J 为空时回退 AD）。`getStrategyApprovers_` 遍历用户，工序经理需同时满足 `策略工序经理` 且 `strategyProcessMatches_`，取第一个匹配；部门经理取第一个 `策略部门经理`；文控取第一个 `发放`。邮箱为空时返回 null。

- [ ] **Step 4: 运行确认通过**

Run: `node --test strategy-users.test.mjs`
Expected: PASS 3 tests

- [ ] **Step 5: 提交**

```bash
git add Code.js strategy-users.test.mjs
git commit -m "V20261111.XX_保养策略审批_userID权限解析"
```

---

### Task 3: 提交（新建/修改/作废）

**Files:**
- Modify: `Code.js`（strategy 区块）
- Test: `strategy-submit.test.mjs`

**Interfaces:**
- Consumes: Task 1 常量/纯函数，Task 2 权限与审批人解析。
- Produces:
  - `submitStrategyNew(payload)` → `{ok:boolean, message?:string, operator?:string}`
  - `submitStrategyEdit(payload)` → 同上
  - `submitStrategyVoid(payload)` → 同上
  - payload：新建 `{jobNumber,name,fields,reason}`；修改 `{jobNumber,name,strategyId,old,fields,reason}`；作废 `{jobNumber,name,strategyId,old,reason}`。
  - `strategyHasPendingRequest_(historyRows, strategyId)` → `boolean`
  - `getStrategyOperator_(jobNumber,name)` → `工号/ JobNumber:  {jobNumber}_姓名/ Name:  {name} {timestamp}`
  - `parseStrategyOperator_(operator)` → `{jobNumber,name}`

- [ ] **Step 1: 写失败测试**

```js
const fields = { '工序':'IM','Machine Type':'FCS','PM Frequency':'季','单次停机时间/ h':'8','PM Description':'季度保养','RBM保养间隔时间':'','RBM保养提醒间隔时间':'','强制保养频率/ Month':'3','策略 / Strategy':'RBM','TasklistName':'[FCS]','是否创工单':'Y','工单类型':'PM10','是否计入AEM':'Y','备注':'' };

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
  seedPending({ operator:'OP-LOCK', process:'IM', strategyId:'PM-MD-0001', isVoid:false });
  const res = g.submitStrategyEdit({ jobNumber:'10001', name:'申请人', strategyId:'PM-MD-0001', old:{...fields, version:'00'}, fields, reason:'修改' });
  assert.equal(res.ok, false);
  assert.match(res.message, /审批中/);
});

test('基线版本不一致时修改被拦下', () => {
  seedMaster({ '策略ID':'PM-MD-0001', '版本号':'01', ...fields });
  const res = g.submitStrategyEdit({ jobNumber:'10001', name:'申请人', strategyId:'PM-MD-0001', old:{...fields, version:'00'}, fields, reason:'修改' });
  assert.equal(res.ok, false);
  assert.match(res.message, /已更新/);
});

test('作废单初始状态为作废待审批', () => {
  seedMaster({ '策略ID':'PM-MD-0001', '版本号':'00', ...fields });
  const res = g.submitStrategyVoid({ jobNumber:'10003', name:'申请人', strategyId:'PM-MD-0001', old:{...fields, version:'00'}, reason:'停止保养' });
  assert.equal(res.ok, true);
  assert.equal(history.values.at(-1)[9], '作废待审批/ Void Pending');
});
```

- [ ] **Step 2: 运行确认失败**

Run: `node --test strategy-submit.test.mjs`
Expected: FAIL（函数未定义）

- [ ] **Step 3: 实现三个提交函数**

共用 `createStrategyRequest_(payload, action)`：校验权限（新建/修改 `编辑`，作废 `作废`）、必填（工序、Machine Type、PM Frequency、PM Description、策略、reason）、审批人存在；修改/作废再读 MasterData 比对 `old.version`，并检查 `strategyHasPendingRequest_`。`Strategy Content` 按设计文档第 2.2 节组装；新建 `strategyId` 留空、`version` 写 `'00'`；修改 `version` 为 `old.version + 1`；作废 `version` 为 `old.version`。History 行按 12 列顺序 `appendRow`，状态按动作取 `STRATEGY_STATUS.pending` 或 `voidPending`。邮件用 `_buildMoCEmailShell`/`_buildMoCInfoTable`，收件人为工序经理。

- [ ] **Step 4: 运行确认通过**

Run: `node --test strategy-submit.test.mjs`
Expected: PASS 4 tests

- [ ] **Step 5: 提交**

```bash
git add Code.js strategy-submit.test.mjs
git commit -m "V20261111.XX_保养策略审批_提交与并发校验"
```

---

### Task 4: 审批（工序经理/部门经理/拒绝）

**Files:**
- Modify: `Code.js`
- Test: `strategy-approve.test.mjs`

**Interfaces:**
- Consumes: Task 1-3 的状态、Operators、权限 helper。
- Produces:
  - `saveStrategyApproval(payload)` → `{ok:boolean, message?:string}`
  - payload：`{jobNumber,name,operator,level:1|2,decision:'approve'|'reject',comment}`
  - `strategyApprovalWord_(decision,email,isVoid)` → `string`

- [ ] **Step 1: 写失败测试**

```js
test('工序经理批准：写 Approver1，状态保持待审批，通知申请人+部门经理', () => {
  seedPending({ operator:'OP-1', process:'IM', isVoid:false });
  const res = g.saveStrategyApproval({ jobNumber:'10001', name:'工序甲', operator:'OP-1', level:1, decision:'approve', comment:'同意' });
  assert.equal(res.ok, true);
  assert.match(history.values[1][4], /^批准\/ Approve/);
  assert.equal(history.values[1][5], '同意');
  assert.equal(history.values[1][9], '待审批/ Pending');
  assert.deepEqual(sent.map(m => m.to).sort(), ['applicant@colpal.com','dept@colpal.com'].sort());
});

test('部门经理批准：状态转待发放，通知申请人+文控', () => {
  seedPending({ operator:'OP-2', process:'IM', isVoid:false, approver1:'批准/ Approve pm.im@colpal.com 2026-11-11 09:00:00' });
  const res = g.saveStrategyApproval({ jobNumber:'10002', name:'部门乙', operator:'OP-2', level:2, decision:'approve', comment:'' });
  assert.equal(res.ok, true);
  assert.equal(history.values[1][9], '待发放/ Wait for Dissminater');
  assert.deepEqual(sent.map(m => m.to).sort(), ['applicant@colpal.com','doc@colpal.com'].sort());
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
});

test('允许自审批', () => {
  seedPending({ operator:'OP-SELF', process:'IM', isVoid:false, submitMail:'pm.im@colpal.com' });
  const res = g.saveStrategyApproval({ jobNumber:'10001', name:'工序甲', operator:'OP-SELF', level:1, decision:'approve', comment:'' });
  assert.equal(res.ok, true);
});
```

- [ ] **Step 2: 运行确认失败**

Run: `node --test strategy-approve.test.mjs`
Expected: FAIL

- [ ] **Step 3: 实现审批函数**

按 `operator` 找 History 行；服务端重新校验角色：`level=1` 需 `策略工序经理` 且工序匹配，`level=2` 需 `策略部门经理`。校验节点开放：L1 要求 `Approver1` 为空、状态 pending/voidPending；L2 要求 `Approver1` 非空、`Approver2` 为空。批准写 `Approver1/2` 与 `Comment1/2`，L1 状态不变、L2 置 `待发放`；拒绝置 `拒绝`。不拦截申请人与审批人相同（自审批允许）。邮件按设计文档第 7 节。

- [ ] **Step 4: 运行确认通过**

Run: `node --test strategy-approve.test.mjs`
Expected: PASS 5 tests

- [ ] **Step 5: 提交**

```bash
git add Code.js strategy-approve.test.mjs
git commit -m "V20261111.XX_保养策略审批_两级审批"
```

---

### Task 5: 发放与退回

**Files:**
- Modify: `Code.js`
- Test: `strategy-release.test.mjs`

**Interfaces:**
- Consumes: Task 1-4 的状态、版本、MasterData 结构。
- Produces:
  - `releaseStrategy(payload)` → `{ok:boolean, message?:string, strategyId?:string, version?:string}`
  - `returnStrategy(payload)` → `{ok:boolean, message?:string}`
  - payload：`{jobNumber,name,operator}`；退回额外 `reason`。

- [ ] **Step 1: 写失败测试**

```js
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
```

- [ ] **Step 2: 运行确认失败**

Run: `node --test strategy-release.test.mjs`
Expected: FAIL

- [ ] **Step 3: 实现发放/退回**

`releaseStrategy` 先校验 `发放` 权限与 `待发放` 状态；解析 `Strategy Content`，按 `strategyAction_` 分支；重读 MasterData 校验版本；新增用 `nextStrategyId_`，修改写回并 +1 版本，作废 `deleteRow`。当前 History 行置 `生效` 或 `作废`，写 `Dissminater`；同一 `strategyId` 的上一生效行置 `取代` 或 `作废`。新增时把生成的 `strategyId` 回填到 History JSON。主表 `最后修改人` 写申请人工号/姓名（用 `parseStrategyOperator_` 从 Operator 解析），文控身份只写 `Dissminater`。发放邮件收件人为申请人，CC 工序经理与部门经理；退回邮件同样。`returnStrategy` 只改状态为 `拒绝`、写 `Dissminater`，不动主表。

- [ ] **Step 4: 运行确认通过**

Run: `node --test strategy-release.test.mjs`
Expected: PASS 5 tests

- [ ] **Step 5: 提交**

```bash
git add Code.js strategy-release.test.mjs
git commit -m "V20261111.XX_保养策略审批_发放与退回"
```

---

### Task 6: 查询、待办计数、初始导入

**Files:**
- Modify: `Code.js`
- Test: `strategy-query-import.test.mjs`

**Interfaces:**
- Consumes: Task 1-5。
- Produces:
  - `getStrategyMasterData()` → `{headers,rows}`
  - `getStrategyHistoryData()` → `{headers,rows}`
  - `getStrategyUserContext(jobNumber)` → `{jobNumber,name,email,permissions,process}`
  - `getStrategyWorkQueue(level,jobNumber)` → `{rows,user,master}`；`level` 为 `'process'|'dept'|'release'`
  - `getStrategyPendingCounts(jobNumber)` → `{process,dept,release,total}`
  - `importPMStrategyMasterData()` → `{ok,count?,message}`

- [ ] **Step 1: 写失败测试**

```js
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
```

- [ ] **Step 2: 运行确认失败**

Run: `node --test strategy-query-import.test.mjs`
Expected: FAIL

- [ ] **Step 3: 实现查询与导入**

队列过滤规则：`process` = 状态 pending/voidPending 且 `Approver1` 空且工序匹配；`dept` = 状态 pending/voidPending 且 `Approver1` 非空、`Approver2` 空；`release` = 状态 `待发放`。`getStrategyPendingCounts` 复用同一过滤。导入读取 EQU `1Iw0-TEvX0m7kIBLSmIpAkF8Z4B6Ri_nQRrmrcfPNlEQ` 的 `MasterData`（全部导入，不按 `是否确认` 过滤），取前 14 列 + 索引 15 `主数据ID` + 索引 18/19 最后修改人/时间；写入新 MasterData（版本 `00`、生效时间=导入时间），并为每条追加一条 `生效` 的基线 History（`Operator='系统导入'`，`Reason='初始导入'`，`submitMail=''`）。若新 MasterData 已有数据则返回失败。

- [ ] **Step 4: 运行确认通过**

Run: `node --test strategy-query-import.test.mjs`
Expected: PASS 4 tests

- [ ] **Step 5: 提交**

```bash
git add Code.js strategy-query-import.test.mjs
git commit -m "V20261111.XX_保养策略审批_查询队列与初始导入"
```

---

### Task 7: 路由注册

**Files:**
- Modify: `Code.js:9-28`（`templateFiles`）
- Modify: `Code.js:37-58`（`pageTitles`）
- Test: `strategy-routes.test.mjs`

**Interfaces:**
- Consumes: 无。
- Produces: 8 个 page key：`strategy_create`, `strategy_modify`, `strategy_void`, `strategy_approval1`, `strategy_approval2`, `strategy_release`, `strategy_progress`, `strategy_viewer`。

- [ ] **Step 1: 写失败测试**

```js
import fs from 'node:fs';
const code = fs.readFileSync(new URL('./Code.js', import.meta.url), 'utf8');
for (const [key, file] of Object.entries({
  strategy_create:'Strategy_Create', strategy_modify:'Strategy_Modify', strategy_void:'Strategy_Void',
  strategy_approval1:'Strategy_Approval1', strategy_approval2:'Strategy_Approval2',
  strategy_release:'Strategy_Release', strategy_progress:'Strategy_Progress', strategy_viewer:'Strategy_Viewer'
})) {
  test(`路由 ${key}`, () => {
    assert.match(code, new RegExp(`${key}:\\s*"${file}"`));
    assert.match(code, new RegExp(`${key}:\\s*"[^"]+ / [^"]+"`));
  });
}
```

- [ ] **Step 2: 运行确认失败**

Run: `node --test strategy-routes.test.mjs`
Expected: FAIL

- [ ] **Step 3: 添加路由与标题**

在 `templateFiles` 追加 8 个键值；在 `pageTitles` 追加设计文档第 5.2 节的中英文标题。

- [ ] **Step 4: 运行确认通过**

Run: `node --test strategy-routes.test.mjs`
Expected: PASS 8 tests

- [ ] **Step 5: 提交**

```bash
git add Code.js strategy-routes.test.mjs
git commit -m "V20261111.XX_保养策略审批_页面路由"
```

---

### Task 8: 共享前端 Helper

**Files:**
- Create: `Strategy_Common_JS.html`
- Test: `strategy-common.test.mjs`

**Interfaces:**
- Consumes: 无。
- Produces（全局，供各页面使用）：
  - `STRATEGY_FIELDS`：14 个 `{key,label,labelEn,type,options?}`。
  - `filterStrategyMasterRows(rows,process,machineType)` → `rows`（修改/作废/查阅共用）。
  - `strategyActionLabel(content)` → `新增 / Create` | `修改 / Edit` | `作废 / Void`
  - `strategyDiffRows(oldFields,newFields)` → `[{key,label,oldValue,newValue,changed}]`
  - `strategyStatusBadge(status)` → `string`
  - `formatStrategyId(strategyId,version)` → `string`
  - `convertFrequencyToMonths(text)` → `number|null`
  - `strategyEscapeHtml(value)` → `string`

- [ ] **Step 1: 写失败测试**

```js
const src = extractScript(fs.readFileSync('Strategy_Common_JS.html','utf8'));
const api = new Function(`${src}; return { STRATEGY_FIELDS, strategyActionLabel, strategyDiffRows, strategyStatusBadge, formatStrategyId, convertFrequencyToMonths, filterStrategyMasterRows };`)();

test('14 个业务字段齐备', () => assert.equal(api.STRATEGY_FIELDS.length, 14));
test('按工序+机型过滤策略行', () => {
  const rows = [{ '工序':'IM','Machine Type':'FCS','策略ID':'PM-MD-0001' },{ '工序':'TF','Machine Type':'FCS','策略ID':'PM-MD-0002' }];
  assert.equal(api.filterStrategyMasterRows(rows,'IM','FCS').length, 1);
});
test('动作标签', () => {
  assert.equal(api.strategyActionLabel({ new:{} }), '新增 / Create');
  assert.equal(api.strategyActionLabel({ old:{}, new:{} }), '修改 / Edit');
  assert.equal(api.strategyActionLabel({ old:{} }), '作废 / Void');
});
test('差异只标记变化字段', () => {
  const d = api.strategyDiffRows({ 'PM Description':'A', '备注':'' }, { 'PM Description':'B', '备注':'' });
  assert.equal(d.find(x => x.key === 'PM Description').changed, true);
  assert.equal(d.find(x => x.key === '备注').changed, false);
});
test('频率换算', () => {
  assert.equal(api.convertFrequencyToMonths('季'), 3);
  assert.equal(api.convertFrequencyToMonths('无法识别'), null);
});
```

- [ ] **Step 2: 运行确认失败**

Run: `node --test strategy-common.test.mjs`
Expected: FAIL（文件不存在）

- [ ] **Step 3: 实现共享 Helper**

`STRATEGY_FIELDS` 顺序与 `STRATEGY_BUSINESS_FIELDS` 一致；下拉选项照设计文档：工序 `FA/IM/PK/TF/WH`，策略 `TBM/RBM/CBM`，工单类型 `PM02/PM10/NA/ZPM4`，是否创工单 `Y/N`，是否计入 AEM `Y/NA`。`convertFrequencyToMonths` 照 EQU `PM_MasterData-js.html` 的映射（含 `0.5周`）。状态徽章颜色照现有 `Tasklist_Approval1_JS` 的映射。

- [ ] **Step 4: 运行确认通过**

Run: `node --test strategy-common.test.mjs`
Expected: PASS 4 tests

- [ ] **Step 5: 提交**

```bash
git add Strategy_Common_JS.html strategy-common.test.mjs
git commit -m "V20261111.XX_保养策略审批_共享前端助手"
```

---

### Task 9: 首页页签与卡片

**Files:**
- Modify: `Tasklist_Home.html:148-235`（新增第三个 tab 与 pane）
- Modify: `Tasklist_Home_JS.html:7-15,35-38,130-149`
- Test: `strategy-home.test.mjs`

**Interfaces:**
- Consumes: Task 6 的 `getStrategyPendingCounts`；Task 7 的路由 key。
- Produces: 首页 8 张策略卡与策略待办徽章。

- [ ] **Step 1: 写失败测试**

```js
const html = fs.readFileSync('Tasklist_Home.html','utf8');
const js = fs.readFileSync('Tasklist_Home_JS.html','utf8');

test('策略页签与 8 张卡存在', () => {
  assert.match(html, /id="pane-strategy"/);
  for (const id of ['strategy_create','strategy_modify','strategy_void','strategy_approval1','strategy_approval2','strategy_release','strategy_progress','strategy_viewer']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
});

test('PAGE_MAP 映射 8 个 page key', () => {
  for (const key of ['strategy_create','strategy_modify','strategy_void','strategy_approval1','strategy_approval2','strategy_release','strategy_progress','strategy_viewer']) {
    assert.match(js, new RegExp(`${key}:\\s*'${key}'`));
  }
});

test('卡片权限属性正确', () => {
  assert.match(html, /id="strategy_create"[\s\S]{0,200}data-perm="编辑"|data-perm="编辑"[\s\S]{0,200}id="strategy_create"/);
  assert.match(html, /data-perm="作废"[\s\S]{0,200}id="strategy_void"/);
  assert.match(html, /data-perm="策略工序经理"[\s\S]{0,200}id="strategy_approval1"/);
  assert.match(html, /data-perm="策略部门经理"[\s\S]{0,200}id="strategy_approval2"/);
});
```

- [ ] **Step 2: 运行确认失败**

Run: `node --test strategy-home.test.mjs`
Expected: FAIL

- [ ] **Step 3: 实现首页**

新增 tab「保养策略 / PM STRATEGY」，pane 内 8 张卡（顺序：新建、修改、作废、工序经理审批、部门经理审批、文控发放、策略进度、策略查阅）。卡片权限：新建/修改 `编辑`，作废 `作废`，两个审批 `策略工序经理` / `策略部门经理`，发放 `发放`，进度 `*`，查阅 `查阅`。`PAGE_MAP` 追加 8 项；`enterWorkspace` 增加策略组的空权限提示 `#strategyEmpty`；在 `enterWorkspace` 内登录后调用 `getStrategyPendingCounts(currentUser.jobNumber)`，有值时显示 `#badge_strategy` 与 tab 徽章。

- [ ] **Step 4: 运行确认通过**

Run: `node --test strategy-home.test.mjs`
Expected: PASS 3 tests

- [ ] **Step 5: 提交**

```bash
git add Tasklist_Home.html Tasklist_Home_JS.html strategy-home.test.mjs
git commit -m "V20261111.XX_保养策略审批_首页入口"
```

---

### Task 10: 新建页

**Files:**
- Create: `Strategy_Create.html`, `Strategy_Create_JS.html`
- Test: `strategy-create-page.test.mjs`

**Interfaces:**
- Consumes: Task 8 `STRATEGY_FIELDS`；Task 3 `submitStrategyNew`。
- Produces: `collectStrategyFormValues($)` → `fields`；`buildStrategyCreatePayload(values,user,reason)` → payload。

- [ ] **Step 1: 写失败测试**

```js
const src = extractScript(fs.readFileSync('Strategy_Create_JS.html','utf8'));
const api = new Function(`${src}; return { buildStrategyCreatePayload };`)();
const values = { '工序':'IM','Machine Type':'FCS','PM Frequency':'季','PM Description':'季度保养','策略 / Strategy':'RBM' };

test('新建 payload 结构', () => {
  const p = api.buildStrategyCreatePayload(values, { jobNumber:'10001', name:'林飞' }, '新增');
  assert.equal(p.jobNumber, '10001');
  assert.equal(p.reason, '新增');
  assert.equal(p.fields['工序'], 'IM');
});
test('缺必填字段返回 null', () => {
  assert.equal(api.buildStrategyCreatePayload({ ...values, 'PM Description':'' }, { jobNumber:'10001', name:'林飞' }, '新增'), null);
});
```

- [ ] **Step 2: 运行确认失败**

Run: `node --test strategy-create-page.test.mjs`
Expected: FAIL

- [ ] **Step 3: 实现页面**

复制现有页面骨架（`Tasklist_Approval1.html` 的 head/navbar/样式），把 navbar 副标题改为 `Tasklist MoC · 保养策略 PM Strategy`；表单按 `STRATEGY_FIELDS` 渲染；频率变化调用 `convertFrequencyToMonths` 自动填 `强制保养频率/ Month`，无法识别加 `bg-warning`；提交前 `buildStrategyCreatePayload` 校验必填；若同工序+机型已存在相同 `PM Description`，用 `Swal` 提示确认但允许继续；调用 `submitStrategyNew`，成功 `timer:1500` 后清空表单。页面顶部注入 `STRATEGY_JOB_NUMBER` / `STRATEGY_USER_NAME`，包含 `Strategy_Common_JS` 后再包含本页 JS。

- [ ] **Step 4: 运行确认通过**

Run: `node --test strategy-create-page.test.mjs`
Expected: PASS 2 tests

- [ ] **Step 5: 提交**

```bash
git add Strategy_Create.html Strategy_Create_JS.html strategy-create-page.test.mjs
git commit -m "V20261111.XX_保养策略审批_新建页"
```

---

### Task 11: 修改页

**Files:**
- Create: `Strategy_Modify.html`, `Strategy_Modify_JS.html`
- Test: `strategy-modify-page.test.mjs`

**Interfaces:**
- Consumes: Task 6 `getStrategyMasterData`；Task 8 `filterStrategyMasterRows` 与其他 helper；Task 3 `submitStrategyEdit`。
- Produces: `buildStrategyEditPayload(strategyId,old,values,user,reason)` → payload。

- [ ] **Step 1: 写失败测试**

```js
const src = extractScript(fs.readFileSync('Strategy_Modify_JS.html','utf8'));
const api = new Function(`${src}; return { buildStrategyEditPayload };`)();

test('修改 payload 带 strategyId 与 old.version', () => {
  const p = api.buildStrategyEditPayload('PM-MD-0001', { '工序':'IM','版本号':'00' }, { '工序':'IM','备注':'x' }, { jobNumber:'10001', name:'林飞' }, '调整频率');
  assert.equal(p.strategyId, 'PM-MD-0001');
  assert.equal(p.old.version, '00');
  assert.equal(p.reason, '调整频率');
});
```

- [ ] **Step 2: 运行确认失败**

Run: `node --test strategy-modify-page.test.mjs`
Expected: FAIL

- [ ] **Step 3: 实现页面**

选择工序与机型 → 调 `getStrategyMasterData` 并 `filterStrategyMasterRows`；表格列出 `PM Description / PM Frequency / 版本号 / 策略ID`；选中行后填充表单，工序、机型、策略ID 设为只读；提交调用 `submitStrategyEdit`，成功后提示并刷新。

- [ ] **Step 4: 运行确认通过**

Run: `node --test strategy-modify-page.test.mjs`
Expected: PASS 2 tests

- [ ] **Step 5: 提交**

```bash
git add Strategy_Modify.html Strategy_Modify_JS.html strategy-modify-page.test.mjs
git commit -m "V20261111.XX_保养策略审批_修改页"
```

---

### Task 12: 作废页

**Files:**
- Create: `Strategy_Void.html`, `Strategy_Void_JS.html`
- Test: `strategy-void-page.test.mjs`

**Interfaces:**
- Consumes: Task 6 `getStrategyMasterData`；Task 8 helper；Task 3 `submitStrategyVoid`。
- Produces: `buildStrategyVoidPayload(strategyId,old,user,reason)` → payload。

- [ ] **Step 1: 写失败测试**

```js
const src = extractScript(fs.readFileSync('Strategy_Void_JS.html','utf8'));
const api = new Function(`${src}; return { buildStrategyVoidPayload };`)();

test('作废 payload 无 new 字段', () => {
  const p = api.buildStrategyVoidPayload('PM-MD-0001', { '工序':'IM','版本号':'00' }, { jobNumber:'10003', name:'林飞' }, '停止保养');
  assert.equal(p.strategyId, 'PM-MD-0001');
  assert.equal(p.old.version, '00');
  assert.equal('fields' in p, false);
});
test('缺原因返回 null', () => {
  assert.equal(api.buildStrategyVoidPayload('PM-MD-0001', { '工序':'IM','版本号':'00' }, { jobNumber:'10003', name:'林飞' }, ''), null);
});
```

- [ ] **Step 2: 运行确认失败**

Run: `node --test strategy-void-page.test.mjs`
Expected: FAIL

- [ ] **Step 3: 实现页面**

选择工序与机型 → 列出当前生效策略 → 选中行后显示策略详情；填写作废原因（必填）；提交调用 `submitStrategyVoid`，成功提示并刷新；页面顶部注入用户变量并包含 `Strategy_Common_JS`。

- [ ] **Step 4: 运行确认通过**

Run: `node --test strategy-void-page.test.mjs`
Expected: PASS 2 tests

- [ ] **Step 5: 提交**

```bash
git add Strategy_Void.html Strategy_Void_JS.html strategy-void-page.test.mjs
git commit -m "V20261111.XX_保养策略审批_作废页"
```

---

### Task 13: 审批页（工序经理 / 部门经理）

**Files:**
- Create: `Strategy_Approval_JS.html`, `Strategy_Approval1.html`, `Strategy_Approval1_JS.html`, `Strategy_Approval2.html`, `Strategy_Approval2_JS.html`
- Test: `strategy-approval-page.test.mjs`

**Interfaces:**
- Consumes: Task 6 `getStrategyWorkQueue`；Task 8 helper；Task 4 `saveStrategyApproval`。
- Produces: `buildStrategyApprovalPayload(row,decision,comment,level,user)` → payload。

- [ ] **Step 1: 写失败测试**

```js
const src = extractScript(fs.readFileSync('Strategy_Approval_JS.html','utf8'));
const api = new Function(`${src}; return { buildStrategyApprovalPayload };`)();

test('工序经理批准 payload', () => {
  const p = api.buildStrategyApprovalPayload({ Operator:'OP-1', Process:'IM' }, 'approve', '同意', 1, { jobNumber:'10001', name:'工序甲' });
  assert.equal(p.level, 1);
  assert.equal(p.decision, 'approve');
  assert.equal(p.operator, 'OP-1');
});
test('部门经理拒绝 payload', () => {
  const p = api.buildStrategyApprovalPayload({ Operator:'OP-2' }, 'reject', '', 2, { jobNumber:'10002', name:'部门乙' });
  assert.equal(p.level, 2);
  assert.equal(p.decision, 'reject');
});
```

- [ ] **Step 2: 运行确认失败**

Run: `node --test strategy-approval-page.test.mjs`
Expected: FAIL

- [ ] **Step 3: 实现共用审批逻辑与两个页面**

`Strategy_Approval_JS.html` 提供 `initStrategyApprovalPage(level)`：按 level 调用 `getStrategyWorkQueue('process'|'dept', jobNumber)`，渲染表格、差异弹窗、批准/拒绝按钮；两个 HTML 页面分别在包含共用 JS 后调用 `initStrategyApprovalPage(1)` / `initStrategyApprovalPage(2)`，标题和队列来源由 level 决定。

- [ ] **Step 4: 运行确认通过**

Run: `node --test strategy-approval-page.test.mjs`
Expected: PASS 2 tests

- [ ] **Step 5: 提交**

```bash
git add Strategy_Approval_JS.html Strategy_Approval1.html Strategy_Approval1_JS.html Strategy_Approval2.html Strategy_Approval2_JS.html strategy-approval-page.test.mjs
git commit -m "V20261111.XX_保养策略审批_审批页"
```

---

### Task 14: 文控发放页

**Files:**
- Create: `Strategy_Release.html`, `Strategy_Release_JS.html`
- Test: `strategy-release-page.test.mjs`

**Interfaces:**
- Consumes: Task 6 `getStrategyWorkQueue('release')`；Task 8 helper；Task 5 `releaseStrategy` / `returnStrategy`。
- Produces: `buildStrategyReleasePayload(row,user)`；`buildStrategyReturnPayload(row,reason,user)`。

- [ ] **Step 1: 写失败测试**

```js
const src = extractScript(fs.readFileSync('Strategy_Release_JS.html','utf8'));
const api = new Function(`${src}; return { buildStrategyReleasePayload, buildStrategyReturnPayload };`)();

test('发放 payload', () => {
  const p = api.buildStrategyReleasePayload({ Operator:'OP-1' }, { jobNumber:'10003', name:'文控丙' });
  assert.equal(p.operator, 'OP-1');
});
test('退回必须填原因', () => {
  assert.equal(api.buildStrategyReturnPayload({ Operator:'OP-1' }, '', { jobNumber:'10003', name:'文控丙' }), null);
  assert.equal(api.buildStrategyReturnPayload({ Operator:'OP-1' }, '信息不全', { jobNumber:'10003', name:'文控丙' }).reason, '信息不全');
});
```

- [ ] **Step 2: 运行确认失败**

Run: `node --test strategy-release-page.test.mjs`
Expected: FAIL

- [ ] **Step 3: 实现页面**

加载 `getStrategyWorkQueue('release', jobNumber)`；表格展示待发放单；差异弹窗；发放按钮调用 `releaseStrategy`；退回按钮弹出原因输入，调用 `returnStrategy`；成功后刷新队列。

- [ ] **Step 4: 运行确认通过**

Run: `node --test strategy-release-page.test.mjs`
Expected: PASS 2 tests

- [ ] **Step 5: 提交**

```bash
git add Strategy_Release.html Strategy_Release_JS.html strategy-release-page.test.mjs
git commit -m "V20261111.XX_保养策略审批_文控发放页"
```

---

### Task 15: 策略进度页

**Files:**
- Create: `Strategy_Progress.html`, `Strategy_Progress_JS.html`
- Test: `strategy-progress-page.test.mjs`

**Interfaces:**
- Consumes: Task 6 `getStrategyHistoryData` / `getStrategyUserContext`；Task 8 helper。
- Produces: `filterStrategyHistoryRows(rows,filters,onlyMine,userEmail)`。

- [ ] **Step 1: 写失败测试**

```js
const src = extractScript(fs.readFileSync('Strategy_Progress_JS.html','utf8'));
const api = new Function(`${src}; return { filterStrategyHistoryRows };`)();

test('按工序/状态过滤', () => {
  const rows = [{ Process:'IM', Status:'待审批/ Pending' },{ Process:'TF', Status:'生效/ Effective' }];
  assert.equal(api.filterStrategyHistoryRows(rows,{ process:'IM', status:'' },false,'').length, 1);
  assert.equal(api.filterStrategyHistoryRows(rows,{ process:'', status:'生效/ Effective' },false,'').length, 1);
});
test('只看我的申请', () => {
  const rows = [{ submitMail:'me@colpal.com' },{ submitMail:'other@colpal.com' }];
  assert.equal(api.filterStrategyHistoryRows(rows,{},true,'me@colpal.com').length, 1);
});
```

- [ ] **Step 2: 运行确认失败**

Run: `node --test strategy-progress-page.test.mjs`
Expected: FAIL

- [ ] **Step 3: 实现页面**

加载 `getStrategyHistoryData` 与 `getStrategyUserContext`；提供工序、机型、状态筛选和「只看我的申请」开关；详情弹窗展示申请类型、审批链、意见与差异。

- [ ] **Step 4: 运行确认通过**

Run: `node --test strategy-progress-page.test.mjs`
Expected: PASS 2 tests

- [ ] **Step 5: 提交**

```bash
git add Strategy_Progress.html Strategy_Progress_JS.html strategy-progress-page.test.mjs
git commit -m "V20261111.XX_保养策略审批_进度页"
```

---

### Task 16: 策略查阅页

**Files:**
- Create: `Strategy_Viewer.html`, `Strategy_Viewer_JS.html`
- Test: `strategy-viewer-page.test.mjs`

**Interfaces:**
- Consumes: Task 6 `getStrategyMasterData` / `getStrategyHistoryData`；Task 8 helper。
- Produces: `buildStrategyVersionHistory(historyRows,strategyId)` → `[{version,action,status,operator,date,content}]`，按版本倒序。

- [ ] **Step 1: 写失败测试**

```js
const src = extractScript(fs.readFileSync('Strategy_Viewer_JS.html','utf8'));
const api = new Function(`${src}; return { buildStrategyVersionHistory };`)();

test('版本历史按版本倒序且只含该策略', () => {
  const rows = [
    { 'Strategy Content': JSON.stringify({ strategyId:'PM-MD-0001', version:'00' }), Status:'取代/ Replace' },
    { 'Strategy Content': JSON.stringify({ strategyId:'PM-MD-0001', version:'01' }), Status:'生效/ Effective' },
    { 'Strategy Content': JSON.stringify({ strategyId:'PM-MD-0002', version:'00' }), Status:'生效/ Effective' },
  ];
  const v = api.buildStrategyVersionHistory(rows,'PM-MD-0001');
  assert.equal(v.length, 2);
  assert.equal(v[0].version, '01');
});
```

- [ ] **Step 2: 运行确认失败**

Run: `node --test strategy-viewer-page.test.mjs`
Expected: FAIL

- [ ] **Step 3: 实现页面**

加载 `getStrategyMasterData` 与 `getStrategyHistoryData`；列表展示当前有效策略并支持工序、机型、关键字筛选；详情弹窗展示当前版本全字段；「版本历史」按钮用 `buildStrategyVersionHistory` 展示全部版本（倒序）。

- [ ] **Step 4: 运行确认通过**

Run: `node --test strategy-viewer-page.test.mjs`
Expected: PASS 1 test

- [ ] **Step 5: 提交**

```bash
git add Strategy_Viewer.html Strategy_Viewer_JS.html strategy-viewer-page.test.mjs
git commit -m "V20261111.XX_保养策略审批_查阅页"
```

---

### Task 17: 语法与全量回归

**Files:**
- Create: `strategy-syntax.test.mjs`
- Modify: `docs/说明文档.md`, `项目记录.md`

**Interfaces:**
- Consumes: 所有新页面与 Code.js。
- Produces: 全量测试通过、文档更新。

- [ ] **Step 1: 写语法测试**

```js
import fs from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractScript } from './strategy-test-utils.mjs';

const files = fs.readdirSync('.').filter(f => /^Strategy_.*_JS\.html$/.test(f));
for (const f of files) {
  test(`${f} 可解析`, () => {
    assert.doesNotThrow(() => new Function(extractScript(fs.readFileSync(f,'utf8'))));
  });
}
```

- [ ] **Step 2: 运行全量测试**

Run: `node --test strategy-*.test.mjs`
Expected: 全部 PASS

- [ ] **Step 3: 语法检查**

Run: `node --check Code.js`
Expected: 无输出（成功）

- [ ] **Step 4: 更新文档**

`说明文档.md` 追加版本说明与服务流程；`项目记录.md` 记录数据表、权限值、页面与导入步骤。

- [ ] **Step 5: 提交**

```bash
git add strategy-syntax.test.mjs docs/说明文档.md 项目记录.md
git commit -m "V20261111.XX_保养策略审批_回归测试与文档"
```

---

### Task 18: 初始导入与上线检查（运营动作）

**Files:**
- 无代码新增；在 GAS 编辑器执行 `importPMStrategyMasterData()`。

- [ ] **Step 1: 执行导入**

在 GAS 编辑器运行 `importPMStrategyMasterData()`，确认返回 `{ok:true, count:80}`。

- [ ] **Step 2: 核对数据**

- `MasterData` 80 行，`策略ID` 保持 `PM-MD-0001`~`PM-MD-0080`，`版本号` 全为 `00`。
- `History` 80 行基线，`Operator=系统导入`，`Status=生效/ Effective`。

- [ ] **Step 3: 切换旧入口**

EQU `PM Master Data` 页面设为只读/停用；`userID` 的 `BM` 列不再作为审批依据。

- [ ] **Step 4: 冒烟测试**

用测试账号走一遍：新建 → 工序经理批 → 部门经理批 → 文控发放 → 查阅页能看到新版本；再走一遍修改与退回。

- [ ] **Step 5: 提交记录**

```bash
git add 项目记录.md
git commit -m "V20261111.XX_保养策略审批_上线记录"
```

---

## Self-Review

- **Spec coverage:** 数据模型 → Task 1/3/5/6；权限 → Task 2；提交流程 → Task 3；审批 → Task 4；发放/退回 → Task 5；查询/导入 → Task 6；路由 → Task 7；8 个页面 → Task 8-16；回归/文档 → Task 17；上线 → Task 18。
- **Review Focus tests:** 版本漂移在 Task 3/5；角色越权在 Task 2/4；邮件断链在 Task 3/4/5；发放锁死在 Task 5；导入顺序/重复在 Task 6。
- **Type consistency:** `{ok,message}` 统一用于所有写操作；payload 字段名 `jobNumber/name/operator/level/decision/comment/reason/strategyId/old/fields` 在各任务中一致。
