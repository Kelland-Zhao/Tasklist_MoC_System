# 保养策略审批（PM Strategy Approval）设计文档

日期：2026-11-11
项目：Tasklist MoC
状态：待评审

## 1. 背景与目标

保养策略目前维护在 EQU 的 PM Master Data 中，只有单人「确认」流程（`userID` 的 `BM` 列 / PM策略审核），没有多级审批。现需要在 Tasklist MoC 项目内新增一套「保养策略审批」，替代现有的单人确认方式，让策略的新增、修改、作废都经过规范流程：

工序经理审批 → 部门经理审批 → 文控发放 → 立即生效。

### 目标

- 按机型维护的保养策略（一行 = 一条策略）可新增、修改、作废，全部走审批链。
- 权限、登录、邮件、页面风格复用 Tasklist MoC 现有能力。
- 每一次提交、审批、发放都有完整记录，任何历史版本可追溯。
- 同一策略同一时间只允许一张在途申请，避免并发覆盖。

### 非目标

- 不改动现有 PM Tasklist（保养任务清单）和 Inspection（点检）流程。
- 本期不处理 EQU PM Master Data 页面和 `BM` 列的停用；后续单独下线。
- 不改变保养计划、工单生成等下游逻辑。

### 反目标

- 不新建第二套权限体系，所有权限都从 `userID` 读取。
- 不允许两条在途申请同时修改同一条策略。
- 不允许覆盖或丢失历史版本。

## 2. 数据模型

### 2.1 策略主数据表

Spreadsheet：`保养策略主数据 / PM Strategy Master Data`
ID：`13LZMFurFP6Lc-iM0UrpNsoYDBgPHDBKVDfFxJ3G8bLs`

新增 sheet：`MasterData`，只保存当前有效版本，一行一条策略。

| # | 列 | 说明 |
|---|----|------|
| 1 | 工序 | `FA / IM / PK / TF / WH` |
| 2 | Machine Type | 机型，文本 |
| 3 | PM Frequency | 保养频率 |
| 4 | 单次停机时间/ h | |
| 5 | PM Description | 保养描述 |
| 6 | RBM保养间隔时间 | |
| 7 | RBM保养提醒间隔时间 | |
| 8 | 强制保养频率/ Month | 频率可识别时自动换算 |
| 9 | 策略 / Strategy | `TBM / RBM / CBM` |
| 10 | TasklistName | |
| 11 | 是否创工单 | `Y / N` |
| 12 | 工单类型 | `PM02 / PM10 / NA / ZPM4` |
| 13 | 是否计入AEM | `Y / NA` |
| 14 | 备注 | |
| 15 | 策略ID | 稳定主键，`PM-MD-0001` |
| 16 | 版本号 | `00`、`01`、`02`… |
| 17 | 生效时间 | 发放时写入 |
| 18 | 最后修改人 | 申请人（内容作者）`工号/姓名`；发放人文控记在 History 的 `Dissminater` |
| 19 | 最后修改时间 | `yyyy-MM-dd HH:mm:ss` |

展示用完整编号：`PM-MD-0001-01`（策略ID + `-` + 版本号），但主键始终是 15 列的 `策略ID`。

### 2.2 申请/审批历史表

Spreadsheet 同上，已有 sheet：`History`，12 列：

`MachineType | Strategy Content | Operator | Reason | Approver1 | Comment1 | Approver2 | Comment2 | Dissminater | Status | submitMail | Process`

- 每次提交追加一行，原记录永不修改（除状态流转）。
- `Strategy Content` 为 JSON：

```json
{
  "strategyId": "PM-MD-0001",
  "version": "01",
  "old": { "version": "00", "工序": "IM", "Machine Type": "FCS", "...": "14 个业务字段" },
  "new": { "工序": "IM", "Machine Type": "FCS", "...": "14 个业务字段" }
}
```

- 申请类型由 `old` / `new` 的有无推断，不单独存 action：
  - 无 `old`、有 `new` → 新增
  - 有 `old`、无 `new` → 作废（删除）
  - 两者都有 → 修改
- 新增申请在提交时 `strategyId` 为空，发放时生成并回填。
- `version`：新增为 `00`；修改为「当前版本 + 1」；作废为「当前版本」。
- `old` / `new` 内放 14 个业务字段；`old` 额外带 `version`（基线版本，发放时与主表比对）；策略身份和「目标版本」放在 JSON 顶层。

### 2.3 版本规则

- 导入或首次生效：`00`
- 每次修改生效：当前版本 + 1（`01`、`02`…）
- 作废不产生新版本；当前版本被标记为作废，主表移除该行
- 被拒绝的申请不消耗版本号；下次提交时重新按主表当前版本 + 1

## 3. 权限模型

统一读取 `userID` spreadsheet（`1F7G3WOY5xM4fEYZ1s5RKulY4kJhqCZ9HefthmiVkraM`）的 `userID` sheet。

| 能力 | 来源 | 范围 |
|------|------|------|
| 登录 | A 工号 / B 姓名 / C 密码 | 现有逻辑 |
| 新建 / 修改策略 | AY 含 `编辑` | 全部工序 |
| 作废策略 | AY 含 `作废` | 全部工序 |
| 工序经理审批 | AY 含 `策略工序经理` | AX 命中的工序（`ALL` 或具体工序） |
| 部门经理审批 | AY 含 `策略部门经理` | 全部工序 |
| 文控发放 | AY 含 `发放` | 全部工序 |
| 策略查阅 | AY 含 `查阅` | 全部工序 |
| 策略进度 | 所有登录用户 | 全部工序 |

- `AY` 为第 50 列（0-based）的逗号分隔权限字符串，现有值保持不动，只追加 `策略工序经理`、`策略部门经理` 两个新值。
- `AX` 为第 49 列「工序」，支持 `ALL` 或单个工序；工序经理必须同时满足 `策略工序经理` 且 AX 命中申请单的 Process。
- 业务约定同一工序只有一个策略工序经理、全公司一个部门经理、一个文控；代码仍按「匹配到的所有人」处理（通知全部、任一人可处理），避免配置疏漏导致流程卡死。
- 审批人邮箱取 `J` 列 GMail；`J` 为空时回退 `AD` 列邮箱。
- 当前用户身份以登录工号（URL 传入的 `jobNumber`）为准。

`getPasswordData()` 需要额外返回 `Authorization`（索引 50）、`Process`（索引 49）、`Email`（索引 9），字段追加不影响现有页面。

## 4. 流程与状态

### 4.1 状态值（沿用现有 Tasklist）

| 状态 | 含义 |
|------|------|
| `待审批/ Pending` | 新增/修改单在流程中 |
| `作废待审批/ Void Pending` | 作废单在流程中 |
| `待发放/ Wait for Dissminater` | 两级审批通过，等文控发放 |
| `拒绝/ Rejected` | 任一步拒绝 |
| `生效/ Effective` | 已发放生效 |
| `取代/ Replace` | 同一策略的上一生效版本被新版本取代 |
| `作废/ Void` | 策略已作废 |

### 4.2 状态流转

新增/修改单：
`待审批` →（工序经理批准）`待审批` →（部门经理批准）`待发放` →（文控发放）`生效`

作废单：
`作废待审批` →（工序经理批准）`作废待审批` →（部门经理批准）`待发放` →（文控发放）`作废`

任一步拒绝：`拒绝`。

- 自审批：允许提交人同时担任本单任一审批节点，不跳过、不拦截，仍按正常节点流转。
- 文控退回：`待发放` 阶段文控可执行「退回」，状态置 `拒绝/ Rejected`，策略解锁，邮件通知申请人并说明原因；不写主表。

- 工序经理、部门经理节点靠 `Approver1` / `Approver2` 是否已填区分，与现有 Tasklist 一致。
- 审批人列格式：`批准/ Approve {email} {yyyy-MM-dd HH:mm:ss}` 或 `拒绝/ Reject {email} {timestamp}`。
- 审批意见写入 `Comment1` / `Comment2`，选填。
- 释放节点写入 `Dissminater`，格式同上。

### 4.3 并发规则

提交修改或作废前，按 `strategyId` 查询 `History`：存在状态为 `待审批`、`作废待审批`、`待发放` 的记录时，拒绝提交并提示「该策略正在审批中」。

新增策略没有 `strategyId`，不做在途锁定；允许同时提交多条新增，发放时各自生成 ID。

## 5. 页面与路由

### 5.1 首页

`Tasklist_Home` 新增第三个页签「保养策略 / PM STRATEGY」，8 张卡：

| 卡片 | ID | 权限 |
|------|----|------|
| 策略新建 | `strategy_create` | `编辑` |
| 策略修改 | `strategy_modify` | `编辑` |
| 策略作废 | `strategy_void` | `作废` |
| 工序经理审批 | `strategy_approval1` | `策略工序经理` |
| 部门经理审批 | `strategy_approval2` | `策略部门经理` |
| 文控发放 | `strategy_release` | `发放` |
| 策略进度 | `strategy_progress` | `*` |
| 策略查阅 | `strategy_viewer` | `查阅` |

首页待办徽章增加策略待办数：工序经理/部门经理/文控按各自队列统计。

### 5.2 页面文件与路由

每个页面一对文件：`Strategy_X.html` + `Strategy_X_JS.html`。

| page key | 模板 | 标题 |
|----------|------|------|
| `strategy_create` | `Strategy_Create` | 保养策略新建 / PM Strategy Create |
| `strategy_modify` | `Strategy_Modify` | 保养策略修改 / PM Strategy Modify |
| `strategy_void` | `Strategy_Void` | 保养策略作废 / PM Strategy Void |
| `strategy_approval1` | `Strategy_Approval1` | 保养策略工序经理审批 / PM Strategy Process Manager Approval |
| `strategy_approval2` | `Strategy_Approval2` | 保养策略部门经理审批 / PM Strategy Department Manager Approval |
| `strategy_release` | `Strategy_Release` | 保养策略文控发放 / PM Strategy Document Control Release |
| `strategy_progress` | `Strategy_Progress` | 保养策略进度 / PM Strategy Progress |
| `strategy_viewer` | `Strategy_Viewer` | 保养策略查阅 / PM Strategy View |

所有页面沿用现有 `include()`、navbar、UI 规范（`docs/UI规范.md`）、SweetAlert 规范与双语格式。

### 5.3 新建页

- 字段与 MasterData 的 14 个业务字段一致。
- 工序下拉、策略下拉、工单类型下拉、是否创工单、是否计入 AEM 的选项与 EQU 保养主数据页一致。
- 机型文本输入；PM Frequency 变化时自动换算强制保养频率，无法识别标黄提醒。
- 变更原因必填。
- 新增时若同工序+机型已存在相同 `PM Description` 的策略，提示确认但允许继续提交（同机型允许年/季等多条策略）。
- 提交后追加 History 行，状态 `待审批`，邮件通知该工序的策略工序经理。

### 5.4 修改页

- 先选工序与机型，展示该机型在 MasterData 中的全部策略行（PM Description / Frequency / 版本号）。
- 选中一条策略后编辑 14 个业务字段；`工序`、`Machine Type`、`策略ID` 锁定。
- 变更原因必填。
- 提交前做在途锁定检查；提交后追加 History 行，状态 `待审批`。

### 5.5 作废页

- 选择方式同修改页，只列当前生效策略。
- 变更原因必填。
- 提交前做在途锁定检查；提交后追加 History 行，状态 `作废待审批`。

### 5.6 审批页（工序经理 / 部门经理）

- 工序经理：`Process` 命中本人 AX 范围，`Approver1` 为空，状态为 `待审批` / `作废待审批`。
- 部门经理：`Approver1` 已填、`Approver2` 为空，状态为 `待审批` / `作废待审批`。
- 列表显示：工序、机型、策略描述、频率、申请类型、申请人、提交时间、变更原因、操作。
- 详情弹窗按字段展示旧值/新值差异；作废单只显示旧值。
- 操作：批准 / 拒绝 + 意见（选填）。
- 批准后更新审批人列、状态并邮件通知下一节点；拒绝后状态 `拒绝` 并邮件通知申请人。

### 5.7 文控发放页

- 队列：状态为 `待发放` 的记录。
- 详情与审批页一致的差异展示。
- 发放动作：
  - 新增：生成下一个策略ID，版本 `00`，写入 MasterData，回填 History 的 `strategyId`。
  - 修改：按 `strategyId` 更新 MasterData，版本 + 1，写生效时间、最后修改人/时间。
  - 作废：按 `strategyId` 移除 MasterData 行。
  - 当前 History 行状态置 `生效` / `作废`；同一策略的上一生效行置 `取代` / `作废`。
  - 写 `Dissminater`，邮件通知申请人并 CC 工序经理、部门经理。
- 退回：`待发放` 也可由文控退回，填写原因后状态置 `拒绝`，解锁该策略，不写主表，邮件通知申请人并 CC 两位经理。

### 5.8 进度页

- 展示全部 History 记录，支持工序、机型、状态筛选。
- 「只看我的申请」开关，按 `submitMail` / 当前用户过滤。
- 详情弹窗展示审批链、意见、差异和当前状态。

### 5.9 查阅页

- 展示 MasterData 当前有效策略，支持工序、机型、关键字筛选。
- 详情弹窗展示当前版本全字段，并可查看该 `strategyId` 的全部历史版本（按版本号倒序）。
- 只读，不提供任何修改入口。

## 6. 后端数据流转

### 6.1 提交

1. 校验权限、必填字段、在途锁定。修改/作废还需重读 MasterData，确认 `old.version` 与当前版本一致；不一致则阻断并提示「策略已更新，请刷新后重试」。
2. 读取当前审批人（按工序匹配工序经理；部门经理、文控全局唯一）。
3. 追加 History 行：MachineType、Strategy Content、Operator、Reason、Approver1~2 空、Dissminater 空、Status、submitMail、Process。
4. 邮件通知下一节点（新增/修改 → 工序经理；作废同样 → 工序经理）。

### 6.2 审批

- 工序经理批准：写 `Approver1`、`Comment1`；状态保持 `待审批` / `作废待审批`；邮件通知申请人和部门经理。
- 部门经理批准：写 `Approver2`、`Comment2`；状态改 `待发放`；邮件通知申请人和文控。
- 任一步拒绝：状态 `拒绝`；邮件通知申请人（CC 已参与的审批人）。

### 6.3 发放

1. 重新读取 MasterData，校验版本与 `old.version` 一致；不一致则中止发放，保持 `待发放`，文控可退回或联系管理员。
2. 按申请类型执行新增/修改/作废。
3. 更新当前 History 行状态、Dissminater。
4. 更新同一策略上一生效行状态。
5. 发送发放邮件。

### 6.4 初始导入

一次性后端函数（不建页面），在 `MasterData` 为空时执行：

- 导入范围：现有 80 条全部导入，不按 `是否确认` 过滤；全部视为当前有效版本 `00`。
- 读取 EQU `PM Master Data`（`1Iw0-TEvX0m7kIBLSmIpAkF8Z4B6Ri_nQRrmrcfPNlEQ` 的 `MasterData`）的 14 个业务字段与 `主数据ID`。
- 写入新 MasterData：保留原 `策略ID`，`版本号 = 00`，`生效时间 = 导入时间`，最后修改人/时间取原表值（有则用，无则留空）。
- 每条策略同步追加一条 History 基线记录：`Strategy Content = { strategyId, version: "00", new: {...} }`、`Operator = 系统导入`、`Reason = 初始导入`、`Status = 生效/ Effective`、`Process` 取原行工序。
- 已存在数据时禁止重复导入。
- 执行顺序：必须先跑导入，再开放新页面；避免新申请先生成低号，或主表非空导致导入被禁止。

## 7. 邮件

沿用现有 `_buildMoCEmailShell` / `_buildMoCInfoTable` 模板与双语风格。

| 节点 | 收件人 | CC |
|------|--------|----|
| 提交 | 工序经理 | — |
| 工序经理批准 | 申请人、部门经理 | — |
| 工序经理拒绝 | 申请人 | — |
| 部门经理批准 | 申请人、文控 | 工序经理 |
| 部门经理拒绝 | 申请人 | 工序经理 |
| 文控发放 | 申请人 | 工序经理、部门经理 |
| 文控退回 | 申请人 | 工序经理、部门经理 |

邮件正文包含：工序、机型、策略描述、变更原因、申请人、申请类型；发放邮件额外包含生效时间。

## 8. 校验与错误处理

- 必填：工序、Machine Type、PM Frequency、PM Description、策略、变更原因。
- 频率换算失败仅提示，不阻断提交。
- 找不到对应工序经理/部门经理/文控时，阻断提交并提示「审批人未配置」。
- 发放时主表行不存在或版本不一致：中止发放，保持 `待发放`，文控可退回或联系管理员。
- 所有写操作加锁/重读校验，避免并发覆盖。

## 9. 实施范围

新增：

- `Strategy_*.html` / `Strategy_*_JS.html` 共 16 个文件。
- `Code.js`：8 个路由 + 提交/审批/发放/查询/导入函数。
- `Tasklist_Home`：新增页签、8 张卡、策略待办徽章。
- `userID`：新增权限值 `策略工序经理`、`策略部门经理`（数据维护，不在代码内）。
- `MasterData` sheet 与初始导入。
- 上线切换：EQU PM Master Data 旧页面设为只读/停用（运营动作，与代码上线同批执行）。

不改动：

- 现有 Tasklist / Inspection 页面和流程。
- EQU PM Master Data 页面、`BM` 列：上线时旧页面设为只读/停用，具体下线操作后续单独处理。

## 10. 留给构建者的决定

- 页面具体布局、表格列宽、弹窗尺寸按 `docs/UI规范.md` 与现有同类页面处理。
- 审批/进度/查阅页的筛选器默认值与刷新交互。
- 差异对比的展示形式（按字段两列或高亮行）。
- 是否需要「导出」功能（本期不做，除非另行提出）。
- 错误提示的具体文案与双语措辞。
