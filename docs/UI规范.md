# Tasklist MoC 页面 UI 规范 / UI Design Guide

> 版本：V1.0（2026-06-01 首次制定）
> 基线：继承 EDS《页面 UI 规范》视觉系统（品牌色、双语、Colgate logo），结合本项目实际技术栈与审批流业务定制。
> 目标：统一 PM 保养与 Inspection 点检两套页面的视觉与交互，降低用户认知成本，加快页面改造速度。
> 配套参考实现：`preview/Tasklist_Home_preview.html`（登录/主页改版样板）。

---

## 0. 本项目与 EDS 规范的差异（先读这条）

| 维度 | EDS 项目 | 本项目 Tasklist MoC |
|---|---|---|
| 依赖加载 | `<?!=include("Kez_*")?>` 内联第三方库 | **全部走 CDN**（Bootstrap/jQuery/DataTables/Icons），仅 SweetAlert2 内联为 `Sweetalert2_js.html` |
| 全局样式 | `CSS.html` 统一引入 | **无全局 CSS 文件**，样式内联在各页 `<style>`（本规范建议逐步抽出公共样式） |
| 业务域 | 多业务域导航中心 | 单一业务：任务清单变更（PM + 点检两个并行模块） |
| 核心数据 | 各模块独立 | 两个模块共用 `Tasklist_history` 审批流表（JSON 数组存任务） |

**结论**：本项目沿用 EDS 的视觉语言（颜色/字号/双语/logo），但**依赖用 CDN、样式内联**，不要引入 `Kez_*` 文件。

---

## 1. 设计原则

| 原则 | 说明 |
|---|---|
| 权限驱动界面 | 用户只看到自己有权限的功能；无权限的入口隐藏而非置灰堆叠（见 §4.3） |
| 双模块对称 | PM 与点检结构镜像，同一动作（修改/审批1/分发…）在两模块视觉一致，仅图标/文案区分 |
| 状态可见 | 审批流每个状态（待审批/生效/作废…）必须有颜色+文字双标识，不靠颜色单独表达（§5） |
| 双语并存 | 中文为主英文为辅，表头/卡片/标签用「中上英下」`<br>`；段落正文与模态框标题用 `/` |
| 信息优先 | 首屏聚焦当前任务（未登录=登录卡；登录后=可用功能），不放装饰动画 |
| 响应式优先 | 桌面/平板/移动各断点可用，移动端不横向滚动（DataTables 除外） |

---

## 2. 视觉系统

### 2.1 配色

| 用途 | 色值 | 应用场景 |
|---|---|---|
| 主品牌色 | `#E60012` | navbar 背景、表头背景、分组/细条左边框、按钮、待办 Badge、焦点边框 |
| 品牌色 hover | `#c4000f` | 主按钮 hover |
| 页面背景 | `#f5f6f8` | body 背景（所有页面必须加） |
| 卡片/表单底色 | `#ffffff` | 卡片、模态框、表单容器、table-wrapper |
| 边框/分隔色 | `#e9ecef` | 卡片默认边框、Tab 下边线、分组线 |
| 次要文字 | `#6c757d` / `#888` / `#adb5bd` | 分组标题、英文副标题、meta、占位 |
| 主体文字 | `#333` | 正文、标题 |

**功能分色**（功能卡图标按审批流阶段着色，制造视觉节奏）：

| 阶段 | 色值 | 包含动作 |
|---|---|---|
| 编辑类 Edit | `#0d6efd`（蓝） | 修改 Modify / 新建 Create / 作废 Void |
| 审批类 Approve | `#fd7e14`（橙） | 班组审批 / 审批1 / 审批2 / 分发 Release |
| 查阅类 View | `#198754`（绿） | 查阅 View / 审批进度 Progress |

### 2.2 字号

| 元素 | 字号 | 字重 |
|---|---|---|
| navbar 品牌中文名 | `xx-large` | bold |
| navbar 品牌英文名（含模块后缀 §3.2） | `14px` | 400，85% 透明 |
| 分组标题 section-title | `13px` | 700，字距 1px，英文大写 |
| Tab 标签中文 | `13px` | active 600 |
| 卡片中文标题 | `14px` | 600 |
| 卡片英文副标题 | `11px` | 400，灰 |
| 用户细条姓名 | `15px` | 600 |
| 表格表头/内容 | `12px` | 表头 bold |
| Badge/徽章 | `10–11px` | 600 |

### 2.3 间距

- 页面左右边距：`px-3`
- 卡片之间：Bootstrap grid `g-3`
- 卡片内边距：`16px 14px`
- 登录卡内边距：`24px 26px`，最大宽 `560px` 居中
- 用户细条：`padding 8px 16px`
- table-wrapper 内边距：`16px`

---

## 3. 页面骨架模板

> 本项目用 CDN，不用 `Kez_*`。所有页面统一用下方骨架。

```html
<!DOCTYPE html>
<html lang="zh-CN">

<head>
  <base target="_top">
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>页面中文名 / English Title</title>

  <!-- CDN（CSS 在前） -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.datatables.net/1.13.6/css/jquery.dataTables.css" /> <!-- 仅表格页 -->

  <style>
    /* 页面特有样式（公共样式见 §4，可后续抽出 CSS.html） */
    body { background: #f5f6f8; }
    .bg-nav { background: #E60012 !important; }
  </style>
</head>

<body>
  <!-- 顶部 navbar -->
  <nav class="navbar navbar-expand-lg bg-nav">
    <div class="container-fluid">
      <a class="navbar-brand" style="display:flex;align-items:center;gap:12px;text-decoration:none;">
        <img src="[Colgate logo data URI，见 §3.1]" alt="Colgate" style="height:60px;">
        <span style="color:white;font-family:Arial,Helvetica,sans-serif;line-height:1.2;">
          <span style="font-size:xx-large;font-weight:bold;">任务清单变更管理</span><br>
          <span style="font-size:14px;font-weight:400;opacity:0.85;">Tasklist MoC · 保养 PM</span> <!-- 模块后缀见 §3.2 -->
        </span>
      </a>
    </div>
  </nav>

  <!-- 主体 -->
  <div class="container-fluid px-3">
    ... 业务内容 ...
  </div>
</body>

<!-- JS（jQuery → DataTables → Bootstrap → SweetAlert → 本页 JS） -->
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.4/jquery.min.js"></script>
<script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.js"></script> <!-- 仅表格页 -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/js/bootstrap.bundle.min.js"></script>
<?!=include("Sweetalert2_js") ?>
<?!=include("PageName_JS") ?>
</html>
```

**强制规则**：
- `<!DOCTYPE html>` + `<html lang="zh-CN">` + `<meta charset="UTF-8">`
- body 背景 `#f5f6f8`
- navbar 必须有 Colgate logo（§3.1）+ 中上英下品牌名 + 模块后缀（§3.2）
- HTML 文件以 **UTF-8 无 BOM** 保存（PowerShell 写文件时用 `[System.IO.File]::WriteAllText(path, text, (New-Object System.Text.UTF8Encoding($false)))`，`Get-Content` 读 UTF-8 中文文件务必显式 `-Encoding UTF8`，否则中文乱码）
- 本页 JS 用 `<?!=include("PageName_JS")?>` 引入（注意 `_JS` 大写，沿用现有命名）

### 3.1 Colgate Logo

navbar 左侧必须放 Colgate logo，高度 60px，与品牌文字间距 12px。

- 来源：EDS 项目同款（Wikipedia `Colgate_logo_red.svg`，红色统一替换为 `#E60012`，转 base64 内联 data URI）
- 取用：复制 `C:\Users\zhaok\Projects\EDS\Navigation.html` 中 `navbar-brand` 内的 `<img src="data:image/svg+xml;base64,...">`
- 不加白色衬底，直接放在红色 navbar 上

### 3.2 navbar 品牌名与模块后缀

navbar 品牌区固定两行：第一行中文 `任务清单变更管理`，第二行英文副标题 `Tasklist MoC`，**英文副标题后必须追加所属模块后缀**，让用户一眼分辨当前在保养还是点检：

| 模块 | 英文副标题（第二行）写法 |
|---|---|
| 保养 PM（`Tasklist_*` 页） | `Tasklist MoC · 保养 PM` |
| 点检 Inspection（`Inspection_*` 页） | `Tasklist MoC · 点检 Inspection` |
| 主页/门户（`Tasklist_Home`，双模块入口） | `Tasklist MoC`（不加后缀） |

```html
<span style="font-size:14px;font-weight:400;opacity:0.85;">Tasklist MoC · 保养 PM</span>
```

**规则**：
- 分隔符用中点 `·`，后跟「中文 + 空格 + English」（如 `保养 PM` / `点检 Inspection`）
- 仅主页（两个模块的共同入口）不加后缀；所有具体业务子页都必须加
- 后缀沿用副标题样式（`14px / 400 / opacity 0.85`），不单独着色

---

## 4. 核心组件

> 以下组件的样板实现见 `preview/Tasklist_Home_preview.html`。

### 4.1 登录卡 login-card（登录/主页专用）

未登录首屏只显示一个聚焦的登录卡：工号（328 前缀）+ 密码 + 登录按钮。输入 5 位工号即回显姓名。

```html
<div class="login-card" id="loginCard">
  <div class="login-head">
    <i class="bi bi-person-badge"></i>
    <div><div class="t-cn">登录</div><div class="t-en">Login</div></div>
  </div>
  <div class="mb-3">
    <label class="field-label" for="jobNumber">工号 <span class="en">Job Number</span></label>
    <div class="input-group">
      <span class="input-group-text">328</span>
      <input type="number" class="form-control" id="jobNumber" placeholder="请输入 5 位工号 / 5-digit No.">
    </div>
    <div id="nameEcho" class="login-hint" style="display:none;color:#198754;">
      <i class="bi bi-check-circle"></i> <span></span>
    </div>
  </div>
  <div class="mb-3">
    <label class="field-label" for="PWD">密码 <span class="en">Password</span></label>
    <input type="password" class="form-control" id="PWD" placeholder="请输入密码 / Password">
  </div>
  <div class="d-grid">
    <button class="btn btn-login text-white" id="loginBtn">登录 / Login</button>
  </div>
</div>
```

```css
.login-card { background:#fff; border:1px solid #e9ecef; border-radius:10px;
  box-shadow:0 1px 3px rgba(0,0,0,0.04); padding:24px 26px; max-width:560px; margin:28px auto 8px; }
.login-card .login-head { display:flex; align-items:center; gap:10px; margin-bottom:20px; }
.login-card .login-head i { color:#E60012; font-size:24px; }
.login-card .login-head .t-cn { font-size:16px; font-weight:600; color:#333; }
.login-card .login-head .t-en { font-size:11px; color:#888; }
.login-card label.field-label { font-size:12px; font-weight:600; color:#333; margin-bottom:4px; }
.login-card label.field-label .en { display:block; font-weight:400; color:#888; font-size:11px; }
.login-card .input-group-text { background:#E60012; color:#fff; border-color:#E60012; font-weight:600; }
.login-card .form-control:focus { border-color:#E60012; box-shadow:0 0 0 0.15rem rgba(230,0,18,0.15); }
.btn-login { background:#E60012; border-color:#E60012; font-weight:600; }
.btn-login:hover { background:#c4000f; border-color:#c4000f; }
.login-hint { font-size:11px; color:#6c757d; margin-top:10px; line-height:1.5; }
```

**规则**：
- `328` 工号前缀用品牌红 `input-group-text`
- 登录成功后**隐藏登录卡，改用 §4.2 用户细条**
- 工号字段 ID 沿用 `jobNumber`、密码沿用 `PWD`（勿改，会破坏现有绑定）

### 4.2 用户细条 user-bar（登录后）

登录成功后登录卡收起为一行细条，让首屏让位给功能区。

```html
<div class="user-bar">
  <span class="u-name"><i class="bi bi-person-circle"></i><span id="uName"></span></span>
  <span class="badge bg-success" id="uPerm">已登录 / N 项权限</span>
  <span class="spacer"></span>
  <button class="btn btn-outline-secondary btn-relogin" id="reloginBtn">
    <i class="bi bi-box-arrow-right"></i> 重新登录 / Switch
  </button>
</div>
```

```css
.user-bar { background:#fff; border-left:4px solid #E60012; border-radius:4px;
  box-shadow:0 1px 3px rgba(0,0,0,0.04); padding:8px 16px; margin:12px 0 16px;
  display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
.user-bar .u-name { font-weight:600; color:#E60012; font-size:15px; }
.user-bar .u-name i { margin-right:6px; }
.user-bar .spacer { flex:1; }
.user-bar .btn-relogin { font-size:12px; padding:3px 12px; }
```

### 4.3 功能入口卡 nav-card

PM/点检的各动作入口用 nav-card，**仅渲染用户有权限的卡**（按 `Authorization` 过滤）。审批进度对所有人可见。

```html
<div class="col-6 col-md-4 col-lg-3 col-xl-2 fn-col grp-edit" data-perm="编辑">
  <button type="button" class="nav-card" id="modify">
    <i class="bi bi-pencil-square icon"></i>
    <div class="title-cn">修改</div><div class="title-en">Modify</div>
  </button>
</div>
<!-- 审批进度（带待办 Badge，永远显示） -->
<div class="col-6 col-md-4 col-lg-3 col-xl-2 fn-col grp-view" data-perm="*">
  <button type="button" class="nav-card" id="progress">
    <span id="badge_pm" class="badge-count" style="display:none;"></span>
    <i class="bi bi-bar-chart-line icon"></i>
    <div class="title-cn">审批进度</div><div class="title-en">Approval Progress</div>
  </button>
</div>
```

```css
.nav-card { background:#fff; border-radius:8px; padding:16px 14px; cursor:pointer;
  transition:all .15s; border:1px solid #e9ecef; display:flex; flex-direction:column;
  align-items:center; text-align:center; min-height:96px; justify-content:center;
  color:#333; width:100%; position:relative; }
.nav-card:hover { border-color:#E60012; box-shadow:0 4px 12px rgba(230,0,18,0.12);
  transform:translateY(-2px); color:#E60012; }
.nav-card .icon { font-size:26px; margin-bottom:6px; }
.nav-card .title-cn { font-size:14px; font-weight:600; line-height:1.2; }
.nav-card .title-en { font-size:11px; color:#888; margin-top:2px; line-height:1.2; }
/* 功能分色（§2.1） */
.grp-edit .icon { color:#0d6efd; }
.grp-approve .icon { color:#fd7e14; }
.grp-view .icon { color:#198754; }
/* 待办数量 Badge */
.nav-card .badge-count { position:absolute; top:8px; right:10px; background:#E60012;
  color:#fff; font-size:11px; font-weight:600; padding:1px 7px; border-radius:10px; }
```

**权限 → 卡映射**（`Authorization` 字段逗号分隔，与现有逻辑一致）：

| 权限 | 解锁的卡 ID（PM / 点检） |
|---|---|
| 编辑 | `modify`,`create` / `modify_IN`,`create_IN` |
| 作废 | `void` / `void_IN` |
| 班组审批 | `approval_Production` / `approval_Production_IN` |
| 审批1 | `approval1` / `approval1_IN` |
| 审批2 | `approval2` / `approval2_IN` |
| 发放 | `dissminater` / `dissminater_IN` |
| 查阅 | `view` / `view_IN` |
| （全员） | `progress` / `progress_IN`（审批进度） |

**规则**：
- 无权限的卡**不渲染**（`display:none`），不要置灰堆叠
- 某模块若只剩审批进度一张卡，显示空状态提示「暂无操作权限，仅可查看审批进度」
- 所有卡 ID 沿用现有命名（含 `_IN` 后缀），勿重命名

### 4.4 模块切换 Tabs（PM / 点检）

主页用 Tabs 分隔 PM 与点检，一屏只看一个模块。标签可挂待办 Badge。

```html
<ul class="nav nav-tabs" id="moduleTabs" role="tablist">
  <li class="nav-item" role="presentation">
    <button class="nav-link active" id="tab-pm" data-bs-toggle="tab" data-bs-target="#pane-pm" type="button" role="tab">
      <span class="tab-cn">保养任务清单<span class="tab-badge" id="tabBadgePm" style="display:none;"></span></span>
      <span class="tab-en">PM TASKLIST</span>
    </button>
  </li>
  <li class="nav-item" role="presentation">
    <button class="nav-link" id="tab-in" data-bs-toggle="tab" data-bs-target="#pane-in" type="button" role="tab">
      <span class="tab-cn">点检任务清单<span class="tab-badge" id="tabBadgeIn" style="display:none;"></span></span>
      <span class="tab-en">INSPECTION TASKLIST</span>
    </button>
  </li>
</ul>
<div class="tab-content">
  <div class="tab-pane fade show active" id="pane-pm" role="tabpanel">
    <div class="table-wrapper"><div class="row g-3" id="pmGrid">...卡...</div></div>
  </div>
  <div class="tab-pane fade" id="pane-in" role="tabpanel">
    <div class="table-wrapper"><div class="row g-3" id="inGrid">...卡...</div></div>
  </div>
</div>
```

```css
.nav-tabs { border-bottom:2px solid #e9ecef; }
.nav-tabs .nav-link { color:#6c757d; border:none; font-size:13px; padding:8px 18px;
  border-bottom:2px solid transparent; margin-bottom:-2px; }
.nav-tabs .nav-link.active { color:#E60012; background:transparent;
  border-bottom-color:#E60012; font-weight:600; }
.nav-tabs .nav-link .tab-cn { display:block; line-height:1.1; }
.nav-tabs .nav-link .tab-en { display:block; font-size:11px; color:#adb5bd; line-height:1.1; margin-top:2px; }
.nav-tabs .nav-link.active .tab-en { color:#E60012; opacity:.7; }
.nav-tabs .nav-link .tab-badge { background:#E60012; color:#fff; font-size:10px;
  font-weight:600; padding:0 6px; border-radius:9px; margin-left:6px; vertical-align:middle; }
.table-wrapper { background:#fff; border-radius:0 0 8px 8px; padding:16px;
  box-shadow:0 1px 3px rgba(0,0,0,0.04); }
```

**规则**：active 态红色下划线；标签双语中上英下；pane 内表格用 DataTables 时切换后调 `columns.adjust()`。

### 4.5 审批流页面骨架（Create / Approve / Dissminater 等子页）

每个审批步骤页（如 `Tasklist_Create`、`Tasklist_Approval1`）统一结构：

```
navbar
└ container-fluid px-3
  ├ section-title「任务信息 / TASK INFO」
  ├ 任务数据区（DataTables 表格，展示 Tasklist JSON 解析后的任务）
  ├ section-title「审批意见 / APPROVAL」
  ├ 审批意见输入（textarea + 审批/驳回 单选或按钮）
  └ 操作按钮区（提交 btn-primary / 返回 btn-secondary）
```

- 服务端注入：子页通过模板变量拿到 `name` / `jobNumber`（见 `Code.js doGet`），用 `<?= name ?>` 填充用户信息
- 审批意见提交统一走 `google.script.run.withSuccessHandler(...).saveApproveX(...)`
- 提交成功用 SweetAlert success toast（§8）

### 4.6 分组标题 section-title

```html
<div class="section-title">任务信息 / TASK INFO</div>
```
```css
.section-title { font-size:13px; font-weight:700; color:#6c757d; letter-spacing:1px;
  margin:18px 0 10px; border-left:3px solid #E60012; padding-left:10px; }
```
英文大写，作视觉锚点。

### 4.7 数据表格 DataTables

展示 `Tasklist_history` / `PM Tasklist` / `PointCheckTaskList` 等数据。

```css
#xxxTable thead th { background-color:#E60012 !important; color:white !important;
  position:sticky; top:0; z-index:10; text-align:center !important; }
/* 表头英文行比中文小一号、细字、略透明 */
#xxxTable thead th small { font-size:0.8em; font-weight:400; opacity:0.85; }
#xxxTable th, #xxxTable td { padding:5px 6px; font-size:12px; vertical-align:middle; text-align:center; }
/* 长文本列（任务描述/检查标准等）左对齐限宽换行 */
#xxxTable td:nth-child(N) { text-align:left; max-width:220px; word-wrap:break-word; overflow-wrap:break-word; }
#xxxTable tbody tr.odd > td { background:#f5f5f5; }
#xxxTable tbody tr.even > td { background:#fff; }
/* 关闭排序图标背景图，避免 404 */
table.dataTable thead > tr > th.sorting,
table.dataTable thead > tr > th.sorting_asc,
table.dataTable thead > tr > th.sorting_desc { background-image:none !important; }
```

**规则**：
- 表头红底白字 sticky；表头文字 `text-align:center !important`
- 双语表头用 `<br>`（中上英下），不用 `/`；**英文行包 `<small>`，比中文小一号**（`机型<br><small>Machine Type</small>`）
- 长文本列（如「Task Description」「Inspection Std」「检查标准」）左对齐 + `max-width` 换行
- 数据 key 保持后端原样（如 `"保养状态/ PM Status"`），仅前端拆分显示
- 斑马纹隔行

### 4.8 状态徽章 status-badge（审批流核心）

`Tasklist_history` 的 `Status` 列与审批进度页必须用状态徽章，颜色见 §5。

```html
<span class="st-badge st-pending">待审批 / Pending</span>
```
```css
.st-badge { display:inline-block; font-size:11px; font-weight:600; padding:2px 10px; border-radius:12px; }
.st-new      { background:#cfe2ff; color:#084298; }  /* 新建 NEW */
.st-pending  { background:#fff3cd; color:#856404; }  /* 待审批 / 待发放 */
.st-effective{ background:#d4edda; color:#155724; }  /* 生效 Effective */
.st-replace  { background:#e2e3e5; color:#41464b; }  /* 取代 Replace */
.st-void     { background:#f8d7da; color:#842029; }  /* 作废 Void */
```

### 4.9 待办 Badge

审批进度入口/Tab 标签上挂待办数量，数据来自 `getPendingCountsForUser()`（统计 `待审批/Pending` + `待发放/Wait for Dissminater`）。

- 卡片角标用 `.badge-count`（§4.3），Tab 标签用 `.tab-badge`（§4.4）
- 数量为 0 时隐藏（`display:none`）

### 4.10 模态框 Modal

用于二次确认/聚合子功能。标题用 `中文 / English`（例外，横线分隔）；危险操作（作废）必须配 SweetAlert 二次确认。

---

## 5. 审批流与状态颜色映射

**审批流程**（PM 与点检一致，函数后缀 `_IN` 区分）：

```
修改/新建 → 班组审批 → 审批1 → 审批2 → 分发 → 执行 → 查阅/进度/作废
Modify/Create → Production → Approval1 → Approval2 → Dissminater → ...
```

**Status 枚举与颜色**：

| Status 值 | 含义 | 徽章 class | 颜色 |
|---|---|---|---|
| `NEW` / `New` | 新建提交 | `st-new` | 蓝 |
| `待审批/ Pending` | 审批中 | `st-pending` | 黄 |
| `待发放/ Wait for Dissminater` | 待分发 | `st-pending` | 黄 |
| `生效` / Effective | 已生效 | `st-effective` | 绿 |
| `取代/ Replace` | 被新版取代 | `st-replace` | 灰 |
| `作废/ Void` | 已作废 | `st-void` | 红 |

> 状态文字必须显示，不靠颜色单独表达（色弱可读）。

---

## 6. 图标

库：Bootstrap Icons v1.11.3（`bi-*`），**不用 Font Awesome**。

| 动作 | 图标 |
|---|---|
| 修改 Modify | `bi-pencil-square` |
| 新建 Create | `bi-file-earmark-plus` |
| 作废 Void | `bi-x-octagon` |
| 班组审批 Production Approval | `bi-people` |
| 审批1 Approval 1 | `bi-1-circle` |
| 审批2 Approval 2 | `bi-2-circle` |
| 分发 Release | `bi-send` |
| 查阅 View | `bi-eye` |
| 审批进度 Progress | `bi-bar-chart-line` |
| 登录 Login | `bi-person-badge` |
| 用户 User | `bi-person-circle` |
| 重新登录 Switch | `bi-box-arrow-right` |
| 无权限 No permission | `bi-shield-lock` |

---

## 7. 命名规范

### 7.1 显示文字
- 表头/卡片标题/Tab/navbar：中上英下 `<br>`，不用 `/`
- 模态框标题、段落正文：用 `中文 / English`

### 7.2 ID / class（重要）
- **现有 ID 一律不重命名**：`jobNumber`、`PWD`、`modify`/`create`/`void`/`approval1`/`approval2`/`approval_Production`/`dissminater`/`view`/`progress` 及全部 `_IN` 变体、`badge_pm`/`badge_in` —— 改名会破坏 `Tasklist_Home_JS` 的 `$('#id').click()` 绑定与权限解锁逻辑
- 新增元素用 PascalCase 或语义化 kebab/camel，保持与现有风格一致
- 跨页跳转 URL：`?page=<key>&jobNumber=xxx&name=xxx`（与 `Code.js doGet` 的 `templateFiles` key 对齐）

### 7.3 文件
- 每页一对：`ModuleName.html`（UI）+ `ModuleName_JS.html`（JS，`_JS` 大写）
- JS 经 `<?!=include("ModuleName_JS")?>` 引入
- SweetAlert2 用 `<?!=include("Sweetalert2_js")?>`

---

## 8. 交互规范

全项目统一用 SweetAlert2 作唯一的提示/弹窗组件，**禁用 `alert()` / `confirm()`**。所有弹窗居中显示（继承 EDS，不用角标 toast），标题/正文一律双语（中上英下小字灰）。

### 8.1 双语 helper（每个 `_JS` 文件开头必须定义）

```js
const swalTitle = (cn, en) => `${cn}<span style="display:block;font-size:0.65em;color:#888;font-weight:400;line-height:1.3;margin-top:4px;">${en}</span>`;
const swalHtml  = (cn, en) => `<div>${cn}<div style="font-size:0.85em;color:#888;margin-top:6px;line-height:1.4;">${en}</div></div>`;
```

- `swalTitle(cn,en)` → 弹窗标题（英文为中文的 0.65em 灰字）
- `swalHtml(cn,en)` → 弹窗正文（英文为 0.85em 灰字）
- 标题用 `title:`，多行说明/错误详情用 `html:`，**不要用 `text:`**（无法双语分级）

### 8.2 五类弹窗显示规范（统一矩阵）

| 类型 | icon | 计时/关闭 | 按钮 | 典型用途 |
|---|---|---|---|---|
| **成功** | `success` | `timer:1500` 自动关 | `showConfirmButton:false` | 提交/保存/审批成功 |
| **错误/失败** | `error` | 不自动关 | `confirmButtonText:'确定 / OK'` | 后端失败、校验不通过、密码错误 |
| **信息提示** | `info` | 不自动关 | `confirmButtonText:'确定 / OK'` | 一般提示、空数据说明 |
| **危险确认** | `warning` | 不自动关 | `showCancelButton:true` + 双语按钮 + `confirmButtonColor:'#E60012'` | 作废等不可逆操作前二次确认 |
| **加载中** | 无 | 手动 `Swal.close()` | `showConfirmButton:false` + `allowOutsideClick:false` | 等待后端返回 |

**统一文案规则**：
- 确认/取消按钮一律双语：`confirmButtonText:'确定 / OK'`、`cancelButtonText:'取消 / Cancel'`
- 成功类**只**用 `timer:1500 + showConfirmButton:false`，不加按钮（短促无打断）
- 错误/信息/警告**不**加 timer，必须用户点确定关闭（避免没看到就消失）
- 危险确认的主按钮用品牌红 `confirmButtonColor:'#E60012'`

### 8.3 标准写法（复制即用）

```js
// 成功
Swal.fire({ icon:'success', title:swalTitle('提交成功','Submitted'), timer:1500, showConfirmButton:false });

// 错误（带详情）
Swal.fire({ icon:'error', title:swalTitle('提交失败','Submit Failed'),
  html:swalHtml('后端返回异常，请重试。','Backend error, please retry.'), confirmButtonText:'确定 / OK' });

// 信息
Swal.fire({ icon:'info', title:swalTitle('暂无数据','No Data'), confirmButtonText:'确定 / OK' });

// 危险操作二次确认
Swal.fire({ icon:'warning', title:swalTitle('确认作废？','Confirm Void?'),
  html:swalHtml('作废后不可恢复。','This cannot be undone.'),
  showCancelButton:true, confirmButtonText:'确认作废 / Void', cancelButtonText:'取消 / Cancel',
  confirmButtonColor:'#E60012'
}).then(res => { if (res.isConfirmed) { /* 执行作废 */ } });

// 加载中（请求前开，withSuccessHandler 里 Swal.close()）
Swal.fire({ title:swalTitle('加载中...','Loading...'),
  allowOutsideClick:false, showConfirmButton:false, didOpen:()=>Swal.showLoading() });
```

> 弹窗内若嵌 DataTables（如任务清单明细），用 `width:'90%' + showCloseButton:true + showConfirmButton:false`，表头仍遵守 §4.7（红底白字、英文小字）。

- 所有后端调用走 `google.script.run.withSuccessHandler(...).fn(...)`，不在 HTML 里写后端逻辑

---

## 9. 新页面 / 改造旧页面检查清单

```
[ ] <!DOCTYPE html> + <html lang="zh-CN"> + <meta charset="UTF-8">
[ ] 文件 UTF-8 无 BOM 保存（中文不乱码）
[ ] body 背景 #f5f6f8
[ ] navbar 有 Colgate logo + 中上英下品牌名 + 模块后缀（保养页 `· 保养 PM` / 点检页 `· 点检 Inspection`，主页不加，§3.2）
[ ] 依赖走 CDN（不引入 Kez_*），SweetAlert2 用 include
[ ] 表头红底白字 sticky；双语用 <br>（中上英下），英文行包 <small> 比中文小一号
[ ] 至少一个 section-title 红色左边框
[ ] 现有按钮/输入 ID 未被重命名（jobNumber/PWD/modify/.../_IN/badge_*）
[ ] 功能卡仅渲染有权限的（无权限隐藏，不置灰堆叠）
[ ] 审批进度卡/Tab 挂待办 Badge（来自 getPendingCountsForUser）
[ ] Status 用状态徽章 + 文字（§5），不靠颜色单独表达
[ ] 响应式 col-6 col-md-4 col-lg-3 col-xl-2
[ ] 操作反馈用 SweetAlert（含双语 swalTitle/swalHtml），无 alert()
[ ] 弹窗按 §8.2 五类矩阵：成功 timer:1500 无按钮；错误/信息 confirmButtonText:'确定 / OK'；加载 showLoading
[ ] 确认/取消按钮文字双语（确定 / OK、取消 / Cancel）
[ ] 危险操作（作废）有二次确认，主按钮 confirmButtonColor:'#E60012'
[ ] 图标只用 Bootstrap Icons（bi-*），无 Font Awesome
[ ] 长文本表格列加 max-width + word-wrap
[ ] DataTables 排序图标 background-image:none
```

---

## 10. 不要做的事

- ❌ 引入 `Kez_*` 内联库（本项目用 CDN）
- ❌ 重命名现有 ID（破坏 JS 绑定）
- ❌ 无权限功能用灰按钮堆叠占屏（应隐藏）
- ❌ 表头/卡片标题用 `/` 横向分隔双语（用 `<br>`）
- ❌ 用 `alert()` / `confirm()`（用 SweetAlert）
- ❌ 在 HTML 里直接写后端逻辑（走 `google.script.run`）
- ❌ 状态只用颜色不写文字
- ❌ 装饰性动画抢首屏
- ❌ 假设屏幕分辨率（永远响应式）
- ❌ PowerShell 用默认编码写/读中文 HTML（必须显式 UTF-8，否则乱码）

---

## 附录：参考实现

- ✅ **登录/主页改版样板**：`preview/Tasklist_Home_preview.html`（登录卡 + 用户细条 + Tabs + 权限过滤卡 + 待办 Badge 完整示例）
- 📖 视觉基线来源：`C:\Users\zhaok\Projects\EDS\docs\UI规范.md`
- 📖 项目通用规范：`CLAUDE.md`（数据源、审批流、权限体系详解）

---

**维护说明**：每改造一个页面，若发现新可复用模式（新组件/新状态色），回来更新对应章节；发现现有规范不合理，**先改文档再改代码**，保持文档与实现同步。
