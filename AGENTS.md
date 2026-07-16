# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## 项目概述

任务清单变更管理系统 (Tasklist MoC) — Google Apps Script Web App，管理保养任务清单 (PM Tasklist) 和点检 (Inspection) 的创建、审批、分发、查阅全流程。

## 常用命令

```bash
clasp pull              # 从 GAS 拉取最新代码
clasp push              # 推送本地代码到 GAS
clasp clone <ScriptId> --rootDir <dir>
```

## 架构

### 路由机制 (Code.js → doGet)

- 入口通过 `e.parameter.page` 路由，`templateFiles` 对象映射 page key → HTML 模板文件名
- 无匹配时返回 404；主页 key 为 `home` → `Tasklist_Home`
- 非 home 页面会注入 `name` 和 `jobNumber` 到模板
- `include(filename)` 实现 `<?!=include("xxx")?>` 服务端包含

### 页面导航方式

首页 (`Tasklist_Home`) 通过 `window.open(url + '?page=<key>&jobNumber=xxx&name=xxx')` 跳转子页面。URL 通过 `google.script.run.getReleaseWebPage()` 获取当前 Web App 部署地址。

### 权限体系

- 用户通过 5 位工号 + 密码登录，数据存在 Google Sheet 的 `Database for Web` 表中
- 每个用户的 `Authorization` 字段包含逗号分隔的权限：`编辑, 查阅, 发放, 审批1, 审批2, 班组审批, 作废`
- 前端根据权限启用/禁用对应按钮（Tasklist 和 Inspection 两套按钮同时生效）

### 审批流程

**Tasklist：** Modify → Create → Production_Approval → Approval1 → Approval2 → Dissminater → 执行 → Viewer/Progress/Void

**Inspection：** Edit → Create → Production_Approval → Approval1 → Approval2 → Dissminater → 执行 → Viewer/Progress/Void

### Google Sheets 数据源

#### 主数据库：`Database_MasterData` (`1bYKTK5a63yJWRHzM_UPP6b4hwF67eZKEM5dCKLWR59U`)

共 17 个子表，是 PM Tasklist 系统的核心后端数据源：

| # | Sheet 名称 | 行数 | 核心用途 |
|---|-----------|------|---------|
| 1 | Temp | 1000 | 临时计算/暂存 |
| 2 | HistoryTaskInfo | 11 | 历史任务信息汇总 |
| 3 | errorCode | 483 | 故障代码主表 v1 |
| 4 | errorCode 2.0 | 1000 | 故障代码主表 v2（当前版本） |
| 5 | Workcenter_V202602 | — | 机台号主数据（Workcenter / Workshop / Process） |
| 6 | Log | — | 运行日志 |
| 7 | 定时设置 | 4 | GAS 触发器定时配置（每月/每周/每日/时间点/程序名/函数名） |
| 8 | 菜单设置 | 6 | GAS 自定义菜单配置（描述/脚本名称/是否显示） |
| 9 | Workcenter & Mold Matrix | 1175 | 机器/模具编号 → 设备类型/Workshop/Process/Type/保养类型 映射 |
| 10 | **PM Tasklist** | 1326 | **PM 任务定义主表（绿色标签）**，每行一条保养任务 |
| 11 | **Tasklist_history** | 166 | **审批流程历史记录**，Tasklist 列存完整任务 JSON |
| 12 | Tasklist Details Bencmark | 9639 | 任务清单详细基准对照表（绿色标签） |
| 13 | Tasklist MoC Report InfomNameList | 996 | MoC 报告通知名单 |
| 14 | **Database for Web** | 67 | **每个 MachineType 对应的 Process + 审批邮件链配置** |
| 15 | Authorization settings | — | 按用户维度的授权审批人（Process/ID/Name → Approval1/2/Dissminater/ccMail/Production） |
| 16 | Production Approval List | — | 生产审批人名单（ID/Name/Mail） |
| 17 | InformNameList | 29 | 通知名单（Process/Workshop/Function/Name/E-mail） |

##### 核心表详解

**PM Tasklist（主任务定义表）** — 16 列：
`MachineType` / `Task No` / `Section` / `Function` / `Failure Mode` / `Task Type` / `Task Description` / `Frecuency` / `Line Status` / `Strategy` / `Resource` / `No Resources` / `Skill Level` / `Tools & Equip` / `Estimated Time` / `Task Status`

每行是一条独立的 PM 保养任务，归属于某个 MachineType。任务编号格式：`{MachineType缩写}-{序号}`（如 `HA-01`）。

**Tasklist_history（审批历史表）** — 15 列：
`MachineType` / `Tasklist`（JSON 数组） / `Operator` / `Reason` / `Production Approver` / `Production Comment` / `Approver1` / `Comment1` / `Approver2` / `Comment2` / `Production Approval (Y/N)` / `Dissminater` / `Status` / `submitMail` / `Process`

- 每条记录是一次 Tasklist 的完整变更/审批过程
- `Tasklist` 列为 JSON 数组字符串，包含该 MachineType 下所有任务的完整定义（与 PM Tasklist 表结构一致，Task Status 字段留空）
- `Operator` 列格式：`工号/ JobNumber:  {jobNumber}_姓名/ Name:  {name} {timestamp}`
- 审批人列格式：`批准/ Approve {email_prefix}@colpal.com {timestamp}`
- `Status` 值：`NEW`（新建）、`取代/ Replace`（已取代）、`作废/ Void`（已作废）

**Database for Web（设备-审批链配置表）** — 7 列（实际表有 19 列）：
`MachineType` / `Process` / `Mail_Approve1` / `Mail_Approve2` / `Mail_Disseninate` / `Mail_CC` / `Mail_Production`

- Process 取值：`PK` / `IM` / `TF`
- 每个 MachineType 配置了完整的审批邮件链（审批1 → 审批2 → 发放 → 抄送 → 生产审批）
- 共 66 个设备类型

**Authorization settings（用户授权表）** — 8 列：
`Process` / `ID`（工号） / `Name` / `Approval 1` / `Approval 2` / `Dissminater` / `ccMail` / `Production Approval`

- 按用户维度存储审批人邮箱前缀（不含 `@colpal.com`），用户登录后可看到自己有审批权限的设备
- `Approval 1/2`、`Dissminater` 等字段根据 Process 类型角色填充不同的人

#### Inspection（点检）数据库：`Database_PointCheck-点检后台数据` (`1RQql-PrcBWiAQNeg7hQKcocpllSUMRhT5XPrDTVWoBY`)

共 25 个子表，时区 `Asia/Shanghai`，是 Inspection 点检系统的完整后端：

| # | Sheet 名称 | 行数 | 核心用途 |
|---|-----------|------|---------|
| 1 | MachineList | 50495 | 全量机台清单（工序/车间/机型/机台号/点检人） |
| 2 | MachineList（New） | 50500 | 机台清单新版 |
| 3 | Database for Web | 993 | MachineType → Process + 审批邮件链配置 |
| 4 | **PointCheckTaskList** | 817 | **点检任务定义主表**，每行一个点检项 |
| 5 | **Tasklist_history** | 976 | **点检审批流程历史**，Tasklist 列存完整点检任务 JSON |
| 6 | MachineList_IM | 375 | IM 工序过滤后的机台清单 |
| 7 | MachineList_TF | 374 | TF 工序过滤后的机台清单 |
| 8 | MachineList_PK | 501 | PK 工序过滤后的机台清单 |
| 9 | Workcenter_List_IM | 49825 | IM 工序 Workcenter → MachineType 映射 |
| 10 | Workcenter_List_Others | 49826 | 其他工序 Workcenter → MachineType/Process 映射 |
| 11 | Effective_Tasklist_IM | — | IM 已生效 Tasklist 的 MachineType 列表（红色标签） |
| 12 | Effective_Tasklist_TF | — | TF 已生效 Tasklist 的 MachineType 列表（红色标签） |
| 13 | Effective_Tasklist_PK | — | PK 已生效 Tasklist 的 MachineType 列表（红色标签） |
| 14 | Effective_Tasklist | — | 合并的已生效 Tasklist 列表 |
| 15 | Effective_Tasklist_Others | — | 其他已生效 Tasklist 列表 |
| 16 | **Authorization settings** | — | 用户授权审批人配置（同 PM 结构） |
| 17 | **INJ-TB1** | 5702 | INJ 工序 TB1 车间点检执行记录 |
| 18 | **INJ-TB2** | 6005 | INJ 工序 TB2 车间点检执行记录 |
| 19 | **TF-TB1** | 6433 | TF 工序 TB1 车间点检执行记录 |
| 20 | **TF-TB2** | 4911 | TF 工序 TB2 车间点检执行记录 |
| 21 | **PK-TB1** | 3064 | PK 工序 TB1 车间点检执行记录 |
| 22 | **PK-TB2** | 3861 | PK 工序 TB2 车间点检执行记录 |
| 23 | StartRow | 7 | 各车间 Sheet 的有效数据行范围配置 |
| 24 | TempNew | 13 | 点检执行记录模板（18 列，与车间 Sheet 同构） |
| 25 | TempOld | 1 | 旧模板 |

##### 核心表详解

**PointCheckTaskList（点检任务定义表）** — 10 列：
`Unit`（单元） / `Parts`（部位） / `Inspection Std`（检查标准） / `Tool`（工具） / `Method`（方法） / `Status`（设备状态） / `Frequency`（频率） / `Machine Type` / `Resource`（点检人角色） / `Process`

每行是一个独立的点检项，归属于某个 MachineType。点检频率：`周检` 为主。Process 取值：`INJ` / `PK` / `TF`。

**Tasklist_history（点检审批历史表）** — 15 列，与 PM 的 Tasklist_history 结构相同：
`MachineType` / `Tasklist`（JSON 数组） / `Operator` / `Reason` / `Production Approver` / `Production Comment` / `Approver1` / `Comment1` / `Approver2` / `Comment2` / `Production Approval (Y/N)` / `Dissminater` / `Status` / `submitMail` / `Process`

- `Tasklist` JSON 结构与 PM 不同，点检任务对象字段为：`Unit` / `Parts` / `Inspection Std` / `Tool` / `Method` / `Status` / `Frequency` / `Machine Type` / `Resource` / `Process`
- `Operator` 格式同 PM：`工号/ JobNumber:  {jobNumber}_姓名/ Name:  {name} {timestamp}`
- Status 枚举同 PM：`New` / `取代/ Replace` / `作废/ Void`

**车间点检执行记录表（INJ-TB1 等 6 个 Sheet）** — 18 列：

| 列 | 字段 | 说明 |
|----|------|------|
| A | Code | 执行编码（格式：`YYYYMMDD{year}W{week}{workshop}{workcenter}`） |
| B | Workshop | 车间（TB1/TB2） |
| C | Process | 工序（INJ/TF/PK） |
| D | MachineType | 机型 |
| E | Frequency | 点检频率 |
| F | PointChecker | 点检人角色（OPC=操作员 / 技术员） |
| G | Ownner | 执行人姓名 |
| H | Submit Date | 提交时间（`YYYY/MM/DD-HH:mm`） |
| I | Workcenter | 机台号 |
| J | Team | 班组（A班/B班） |
| K | 点检任务明细 | **核心**：JSON 数组，每个元素是一个点检项的执行结果 |
| L | 点检任务数量 | 任务总数 |
| M | 点检任务异常已解决明细 | JSON 数组，异常已解决项 |
| N | 点检任务异常已解决数量 | 已解决数量 |
| O | 点检任务异常未解决明细 | JSON 数组，异常未解决项 |
| P | 点检任务异常未解决数量 | 未解决数量 |
| Q | 点检任务异常备注明细 | JSON 数组，有备注的项 |
| R | 点检任务备注数量 | 备注数量 |

点检任务明细 JSON 元素结构：
```json
{
  "编号": "INJPC001",
  "单元": "HIM 液压",
  "部位及内容": "锁模缸-HIM 液压",
  "检查标准": "端盖无泄漏",
  "使用工具": "NA",
  "方法": "目测",
  "设备状态": "开机",
  "检查频率": "周检",
  "点检人": "INJ",
  "检查状态": true,
  "备注": "",
  "是否解决": true,
  "图片": ""
}
```

**StartRow 表** — 控制各车间 Sheet 的读写范围：
`StartRow` / `LastRow` / `Rows` / `Days to Edit` / `SheetName`

每个车间 Sheet 有固定的行范围，`Days to Edit` = 7 表示点检数据 7 天内可编辑。

**MachineList** — 5 列：`工序` / `车间` / `机型` / `机台号` / `点检人`
全量机台清单，是点检任务分发的基础。点检人取值：`操作员/ OPC`（操作员执行）或 `技术员/ Technician`（技术员执行）。

##### PM 与 Inspection 的关键差异

| 维度 | PM Tasklist | Inspection |
|------|-----------|------------|
| 任务粒度 | 按 MachineType 的一组保养任务（更换/检查/清洁） | 按 MachineType 的一组点检项（目测为主） |
| 任务定义表 | PM Tasklist（16 列） | PointCheckTaskList（10 列） |
| 执行记录 | 在 Tasklist_history 中通过 Status 流转 | 在 6 个车间 Sheet 中按周记录，含异常跟踪 |
| 执行编码 | 无 | 有 Code（含日期/周次/车间/机台信息） |
| 异常处理 | 无独立追踪 | 异常已解决/未解决/备注 三类明细 |
| 编辑窗口 | 无限制 | `Days to Edit` = 7 天 |
| JSON 任务字段 | `Task Type` / `Task Description` / `Failure Mode` 等 | `单元` / `部位及内容` / `检查标准` / `方法` 等 |

### 依赖加载方式

**注意：** 此项目大部分库使用 CDN 引入，而非内联嵌入：
- Bootstrap 5.3.1 CSS/JS、jQuery 3.6.4、DataTables 1.13.6、Bootstrap Icons → CDN
- 仅 SweetAlert2 内联为 `Sweetalert2_js.html`

### 文件命名约定

- 每个功能页面一对文件：`ModuleName.html`（UI）+ `ModuleName_JS.html`（JS 逻辑，注意 `_JS` 大写）
- JS 文件通过 `<?!=include("XXX_JS") ?>` 在 HTML 底部引入

### 配置

- Web App 部署为 `USER_ACCESSING` 身份执行，访问权限 `DOMAIN`（colpal.com 域内）
- 时区：`Asia/Shanghai`
- `.clasp.json` 含 scriptId: `1IK4dfLsktnWzI3LnBayDhZWTCAfSCmv-mev9fH9RbcC88P08Crl6vONG`
