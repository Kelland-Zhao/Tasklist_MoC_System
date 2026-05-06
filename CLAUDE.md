# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

| Sheet ID | 用途 |
|----------|------|
| `1bYKTK5a63yJWRHzM_UPP6b4hwF67eZKEM5dCKLWR59U` | 主数据：Tasklist_history（审批记录）、Database for Web（用户/权限表） |
| `1RQql-PrcBWiAQNeg7hQKcocpllSUMRhT5XPrDTVWoBY` | Inspection Edit/Void 页面的数据源 |

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
