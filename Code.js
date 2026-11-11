const webIconUrl =
  "https://images.ctfassets.net/m3056igwnpsm/2QQOLoOlu2v9JFVVjTnsrz/8fea197464768353c908b0c2c9d0edb3/EDS.png";
const releaseWeburl_exec =
  "https://script.google.com/a/macros/colpal.com/s/AKfycbxpDYL02i5FaFzUDcIoW3siG2U94cvWUUnz_F5x2BO1jnrXoMGzFQH-jw9C4nvZ7FE/exec";
const releaseWeburl_dev =
  "https://script.google.com/a/macros/colpal.com/s/AKfycbwQQLTjqojw5DrCQlVht_krcyfT8Us21EAUfQf6f6E/dev";

function doGet(e) {
  var templateFiles = {
    modify: "Tasklist_MoC_Modify",
    Production_Approval: "Tasklist_Production_Approval",
    approve1: "Tasklist_Approval1",
    approve2: "Tasklist_Approval2",
    dissminater: "Tasklist_Dissminater",
    create: "Tasklist_Create",
    viewer: "Tasklist_Viewer",
    home: "Tasklist_Home",
    void: "Tasklist_void",
    progress: "Tasklist_Progress",
    Inspection_Edit: "Inspection_Edit",
    Inspection_Create: "Inspection_Create",
    Inspection_Approve1: "Inspection_Approve1",
    Inspection_Approve2: "Inspection_Approval2",
    Inspection_Production_Approval: "Inspection_Production_Approval",
    Inspection_Dissminater: "Inspection_Dissminater",
    Inspection_View: "Inspection_Viewer",
    Inspection_Void: "Inspection_Void",
    Inspection_Progress: "Inspection_Progress",
    strategy_create: "Strategy_Create",
    strategy_modify: "Strategy_Modify",
    strategy_void: "Strategy_Void",
    strategy_approval1: "Strategy_Approval1",
    strategy_approval2: "Strategy_Approval2",
    strategy_release: "Strategy_Release",
    strategy_progress: "Strategy_Progress",
    strategy_viewer: "Strategy_Viewer",
  };

  var templateName = e.parameter.page || "home";

  if (templateFiles.hasOwnProperty(templateName)) {
    var tmp = HtmlService.createTemplateFromFile(templateFiles[templateName]);
    
    // 设置页面标题 — 格式参照 EDS: 中文 | English
    var pageTitles = {
      modify: "保养编辑 | PM Edit",
      void: "保养作废 | PM Void",
      create: "保养新建 | PM Create",
      viewer: "保养查阅 | PM View",
      approve1: "保养审批1 | PM Approval1",
      approve2: "保养审批2 | PM Approval2",
      Production_Approval: "保养班组审批 | PM Production Approval",
      dissminater: "保养分发 | PM Release",
      progress: "保养审批进度 | PM Approval Progress",
      Inspection_Edit: "点检编辑 | Inspection Edit",
      Inspection_Create: "点检新建 | Inspection Create",
      Inspection_Void: "点检作废 | Inspection Void",
      Inspection_View: "点检查阅 | Inspection View",
      Inspection_Approve1: "点检审批1 | Inspection Approval1",
      Inspection_Approve2: "点检审批2 | Inspection Approval2",
      Inspection_Production_Approval: "点检班组审批 | Inspection Production Approval",
      Inspection_Dissminater: "点检分发 | Inspection Release",
      Inspection_Progress: "点检审批进度 | Inspection Approval Progress",
      strategy_create: "保养策略新建 / PM Strategy Create",
      strategy_modify: "保养策略修改 / PM Strategy Modify",
      strategy_void: "保养策略作废 / PM Strategy Void",
      strategy_approval1: "保养策略工序经理审批 / PM Strategy Process Manager Approval",
      strategy_approval2: "保养策略部门经理审批 / PM Strategy Department Manager Approval",
      strategy_release: "保养策略文控发放 / PM Strategy Document Control Release",
      strategy_progress: "保养策略进度 / PM Strategy Progress",
      strategy_viewer: "保养策略查阅 / PM Strategy View",
      home: "任务清单变更管理主页 | Tasklist MoC Home"
    };
    
    // 设置页面标题
    if (pageTitles.hasOwnProperty(templateName)) {
      tmp.pageTitle = pageTitles[templateName];
    }

    // EDS 跨项目免密登录：将 URL 参数注入 home 模板（GAS 沙箱 iframe 内无法读取部署 URL 参数）
    if (templateName === "home") {
      tmp.jobNumberUrl = e.parameter.jobNumber || '';
      tmp.pwdUrl = e.parameter.pwd || '';
    }

    if (templateName !== "home") {
      let name = e.parameter.name;
      let jobNumber = e.parameter.jobNumber;
      tmp.name = name;
      tmp.jobNumber = jobNumber;
      // console.log(jobNumber, name)
    }

    if (
      templateName === "Inspection_Edit" ||
      templateName === "Inspection_Void"
    ) {
      var id = "1RQql-PrcBWiAQNeg7hQKcocpllSUMRhT5XPrDTVWoBY";
      var ss = SpreadsheetApp.openById(id);

      // 1. 获取名为 "Tasklist_history" 的工作表
      var ws = ss.getSheetByName("Tasklist_history");

      // 2. 获取从第二行开始的所有数据
      // 使用 getRange/getValues 比 getSheetValues 更安全，可以避免空表头引发的错误
      var allValues = ws
        .getRange(2, 1, ws.getLastRow() - 1, ws.getLastColumn())
        .getValues();

      // 3. 筛选和映射数据
      var filteredData = allValues
        .filter(function (row) {
          // 筛选条件：检查 M 列 (数组索引为 12) 的单元格是否包含 "生效"
          // 同时要确保该单元格有值且为字符串，防止出错
          return (
            row[12] &&
            typeof row[12].includes === "function" &&
            row[12].includes("生效")
          );
        })
        .map(function (filteredRow) {
          // 提取符合条件的行的 A 列 (数组索引为 0) 数据
          return filteredRow[0];
        });

      // 4. 将最终结果赋值给 tmp.data
      tmp.data = filteredData;
    }

    // {
    //   var id = "1RQql-PrcBWiAQNeg7hQKcocpllSUMRhT5XPrDTVWoBY";

    //   var ss = SpreadsheetApp.openById(id);

    //   var ws = ss.getSheetByName("Database for Web");

    //   var value = ws.getSheetValues(
    //     2,
    //     1,
    //     ws.getLastRow() - 1,
    //     ws.getLastColumn()
    //   );
    //   var machineType = value.map(function (row) {
    //     return row[0];
    //   });
    //   tmp.data = machineType;
    // }

    if (templateName === "modify" || templateName === "void") {
      // 仅修改此处的 ID
      var id = "1bYKTK5a63yJWRHzM_UPP6b4hwF67eZKEM5dCKLWR59U";
      var ss = SpreadsheetApp.openById(id);

      // 1. 获取名为 "Tasklist_history" 的工作表
      var ws = ss.getSheetByName("Tasklist_history");

      // 2. 获取从第二行开始的所有数据
      // 使用 getRange/getValues 比 getSheetValues 更安全，可以避免空表头引发的错误
      var allValues = ws
        .getRange(2, 1, ws.getLastRow() - 1, ws.getLastColumn())
        .getValues();

      // 3. 筛选和映射数据
      var filteredData = allValues
        .filter(function (row) {
          // 筛选条件：检查 M 列 (数组索引为 12) 的单元格是否包含 "生效"
          // 同时要确保该单元格有值且为字符串，防止出错
          return (
            row[12] &&
            typeof row[12].includes === "function" &&
            row[12].includes("生效")
          );
        })
        .map(function (filteredRow) {
          // 提取符合条件的行的 A 列 (数组索引为 0) 数据
          return filteredRow[0];
        });

      // 4. 将最终结果赋值给 tmp.data
      tmp.data = filteredData;
    }
    //   {
    //   var id = "1bYKTK5a63yJWRHzM_UPP6b4hwF67eZKEM5dCKLWR59U";

    //   var ss = SpreadsheetApp.openById(id);

    //   var ws = ss.getSheetByName("Database for Web");

    //   var value = ws.getSheetValues(
    //     2,
    //     1,
    //     ws.getLastRow() - 1,
    //     ws.getLastColumn()
    //   );
    //   var machineType = value.map(function (row) {
    //     return row[0];
    //   });
    //   tmp.data = machineType;
    // }

    return tmp
      .evaluate()
      .setTitle(pageTitles[templateName] || "Tasklist_" + templateName)
      .setFaviconUrl(webIconUrl);
  } else {
    return HtmlService.createHtmlOutput("Page not found.");
  }
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getReleaseWebPage() {
  let webPageUrl = ScriptApp.getService().getUrl(); //获取当前的url
  console.log(webPageUrl);
  return webPageUrl;
}

function getPendingCountsForUser() {
  var pmCount = getPendingCountForDb("1bYKTK5a63yJWRHzM_UPP6b4hwF67eZKEM5dCKLWR59U", null);
  var inCount = getPendingCountForDb("1RQql-PrcBWiAQNeg7hQKcocpllSUMRhT5XPrDTVWoBY", null);
  return { pmCount: pmCount, inCount: inCount };
}

function getPendingCountForDb(dbId, emailPrefix) {
  var ss = SpreadsheetApp.openById(dbId);
  var wsHistory = ss.getSheetByName("Tasklist_history");
  if (!wsHistory) return 0;

  var historyData = wsHistory.getRange(2, 1, wsHistory.getLastRow() - 1, 15).getValues();

  var count = 0;
  historyData.forEach(function(row) {
    var status = (row[12] || "").toString().trim();
    if (status === "待审批/ Pending" || status === "待发放/ Wait for Dissminater") {
      count++;
    }
  });

  return count;
}

function getData() {
  var id = "1bYKTK5a63yJWRHzM_UPP6b4hwF67eZKEM5dCKLWR59U";
  var ss = SpreadsheetApp.openById(id);
  // var ws = ss.getSheetByName("PM Tasklist");
  let ws = ss.getSheetByName("Tasklist_history");
  var value = ws.getSheetValues(2, 1, ws.getLastRow(), ws.getLastColumn());
  var head = ws.getSheetValues(1, 1, 1, ws.getLastColumn());
  var arrays = new Array(); //创建数组

  var userEmail = Session.getActiveUser().getEmail();

  for (var i = 0; i < value.length; i++) {
    var tasklist = {}; //创建对象
    for (var j = 0; j < head[0].length; j++) {
      tasklist[head[0][j]] = value[i][j];
    }
    arrays.push(tasklist);
  }
  // return arrays
  let result = [arrays, userEmail];
  console.log(arrays);
  return result;
  // console.log(arrays)
}

function dataSave(
  obj,
  loginInfo,
  reason,
  status,
  userEmail,
  process,
  production_Approval
) {
  try {
    var id = "1bYKTK5a63yJWRHzM_UPP6b4hwF67eZKEM5dCKLWR59U";

    var ss = SpreadsheetApp.openById(id);

    var ws = ss.getSheetByName("Tasklist_history");

    let ws_mailAddress = ss.getSheetByName("Database for Web");

    // 使用 getRange/getValues 比 getSheetValues 更安全
    let data = ws_mailAddress
      .getRange(2, 1, ws_mailAddress.getLastRow() - 1, ws_mailAddress.getLastColumn())
      .getValues();

    // 机型可能来自 Tasklist JSON，历史数据中存在前导/尾随空格，写入前统一清理
    let machineType = (JSON.parse(obj)[0].MachineType || '').toString().trim();

    console.log("machineType", machineType);

    let row = data.filter((r) => {
      return r[0].toString().trim() == machineType.trim();
    });

    if (row.length === 0) {
      console.error("Database for Web 中未找到机型: " + machineType);
      return "machine_not_configured";
    }

    let production_Approval_words = "";

    let recipient;

    if (production_Approval == true) {
      production_Approval_words = "Y";

      recipient = row[0][6]; //Mail_Production
    } else {
      production_Approval_words = "N";

      recipient = row[0][2]; //Mail_Approve1
    }

    if (!recipient) {
      console.error("审批邮件收件人为空: " + machineType);
      return "machine_not_configured";
    }

    ws.appendRow([
      machineType,
      obj,
      loginInfo,
      reason,
      "",
      "",
      "",
      "",
      "",
      "",
      production_Approval_words,
      "",
      status,
      userEmail,
      process,
    ]);

    let subject = "任务清单变更申请/ Tasklist MoC Application";
    let bodyHtml = "";
    bodyHtml += "<p style='font-size:15px;margin:0 0 12px'>您有一份保养任务变更申请需要审批 / You have a PM tasklist change request pending approval</p>";
    bodyHtml += _buildMoCInfoTable(
      ["机型/ Machine Type", "任务类型/ Task Type", "变更原因/ Change Reason", "申请人/ Applier"],
      [[machineType, "保养/ PM", reason, userEmail]]
    );
    bodyHtml += "<p style='font-size:13px;margin-top:16px'>您可以点击下面的链接来登录系统：<br><a href='https://script.google.com/a/macros/colpal.com/s/AKfycbxpDYL02i5FaFzUDcIoW3siG2U94cvWUUnz_F5x2BO1jnrXoMGzFQH-jw9C4nvZ7FE/exec'>任务清单变更管理/ Tasklist MoC</a></p>";
    GmailApp.sendEmail(recipient, subject, "", { htmlBody: _buildMoCEmailShell(subject, bodyHtml) });
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

function dataSave_IN(
  obj,
  loginInfo,
  reason,
  status,
  userEmail,
  process,
  production_Approval
) {
  try {
    var id = "1RQql-PrcBWiAQNeg7hQKcocpllSUMRhT5XPrDTVWoBY";

    var ss = SpreadsheetApp.openById(id);

    var ws = ss.getSheetByName("Tasklist_history");

    let machineType = JSON.parse(obj)[0]["Machine Type"];

    let production_Approval_words = "";

    let ws_mailAddress = ss.getSheetByName("Database for Web");

    // 使用 getRange/getValues 比 getSheetValues 更安全
    let data = ws_mailAddress
      .getRange(2, 1, ws_mailAddress.getLastRow() - 1, ws_mailAddress.getLastColumn())
      .getValues();

    let row = data.filter((r) => {
      return r[0].toString().trim() == machineType.trim();
    });

    if (row.length === 0) {
      console.error("Database for Web 中未找到机型: " + machineType);
      return "machine_not_configured";
    }

    let recipient;

    if (production_Approval == true) {
      production_Approval_words = "Y";

      recipient = row[0][6]; //Mail_Production
    } else {
      production_Approval_words = "N";

      recipient = row[0][2]; //Mail_Approve1
    }

    if (!recipient) {
      console.error("审批邮件收件人为空: " + machineType);
      return "machine_not_configured";
    }

    ws.appendRow([
      machineType,
      obj,
      loginInfo,
      reason,
      "",
      "",
      "",
      "",
      "",
      "",
      production_Approval_words,
      "",
      status,
      userEmail,
      process,
    ]);

    let subject = "任务清单变更申请/ Tasklist MoC Application";
    let bodyHtml = "";
    bodyHtml += "<p style='font-size:15px;margin:0 0 12px'>您有一份点检任务变更申请需要审批 / You have an Inspection tasklist change request pending approval</p>";
    bodyHtml += _buildMoCInfoTable(
      ["机型/ Machine Type", "任务类型/ Task Type", "变更原因/ Change Reason", "申请人/ Applier"],
      [[machineType, "点检/ Inspection", reason, userEmail]]
    );
    bodyHtml += "<p style='font-size:13px;margin-top:16px'>您可以点击下面的链接来登录系统：<br><a href='https://script.google.com/a/macros/colpal.com/s/AKfycbxpDYL02i5FaFzUDcIoW3siG2U94cvWUUnz_F5x2BO1jnrXoMGzFQH-jw9C4nvZ7FE/exec'>任务清单变更管理/ Tasklist MoC</a></p>";
    GmailApp.sendEmail(recipient, subject, "", { htmlBody: _buildMoCEmailShell(subject, bodyHtml) });
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

// function getUserEmail() {
//   var userEmail = Session.getActiveUser().getEmail();
//   Logger.log('当前登录用户的邮箱地址：' + userEmail);
// }

function getApprovaldata() {
  let id = "1bYKTK5a63yJWRHzM_UPP6b4hwF67eZKEM5dCKLWR59U";
  let ss = SpreadsheetApp.openById(id);
  let ws_Tasklisthistory = ss.getSheetByName("Tasklist_history");
  let data = ws_Tasklisthistory.getSheetValues(
    2,
    1,
    ws_Tasklisthistory.getLastRow(),
    ws_Tasklisthistory.getLastColumn()
  );
  let head = ws_Tasklisthistory.getSheetValues(
    1,
    1,
    1,
    ws_Tasklisthistory.getLastColumn()
  );
  // console.log(head[0]);

  let objArraytoApproval = [];
  for (i = 0; i < data.length; i++) {
    let obj = {};
    for (j = 0; j < head[0].length; j++) {
      obj[head[0][j]] = data[i][j];
    }
    objArraytoApproval.push(obj);
  }
  // console.log(bjArraytoApproval)
  let ws_mailAddress = ss.getSheetByName("Database for Web");
  let dataApproval = ws_mailAddress.getSheetValues(
    1,
    1,
    ws_mailAddress.getLastRow(),
    ws_mailAddress.getLastColumn()
  );
  let headApproval = dataApproval[0];
  // console.log(headApproval)

  let ws_authorization = ss.getSheetByName("Authorization settings");
  let dataAuthorization = ws_authorization.getSheetValues(
    2,
    1,
    ws_authorization.getLastRow() - 1,
    ws_authorization.getLastColumn()
  );
  let headAuthorization = dataAuthorization[0];
  let objArrAuthorization = [];
  for (i = 1; i < dataAuthorization.length; i++) {
    let obj = {};
    for (j = 0; j < headAuthorization.length; j++) {
      obj[headAuthorization[j]] = dataAuthorization[i][j];
    }
    objArrAuthorization.push(obj);
  }
  // console.log(objArrAuthorization)

  let objArrayEmail = [];
  for (i = 1; i < dataApproval.length; i++) {
    let obj = {};
    for (j = 0; j < headApproval.length; j++) {
      obj[headApproval[j]] = dataApproval[i][j];
    }
    objArrayEmail.push(obj);
  }
  // console.log(objArrayEmail)

  let userEmail = Session.getActiveUser().getEmail();
  let result = [
    objArraytoApproval,
    objArrayEmail,
    userEmail,
    objArrAuthorization,
  ];
  console.log(result);
  return result;
}

function getApprovaldata_IN() {
  let id = "1RQql-PrcBWiAQNeg7hQKcocpllSUMRhT5XPrDTVWoBY";
  let ss = SpreadsheetApp.openById(id);
  let ws_Tasklisthistory = ss.getSheetByName("Tasklist_history");
  let data = ws_Tasklisthistory.getSheetValues(
    2,
    1,
    ws_Tasklisthistory.getLastRow(),
    ws_Tasklisthistory.getLastColumn()
  );
  let head = ws_Tasklisthistory.getSheetValues(
    1,
    1,
    1,
    ws_Tasklisthistory.getLastColumn()
  );
  // console.log(head[0]);

  let objArraytoApproval = [];
  for (i = 0; i < data.length; i++) {
    let obj = {};
    for (j = 0; j < head[0].length; j++) {
      obj[head[0][j]] = data[i][j];
    }
    objArraytoApproval.push(obj);
  }
  // console.log(bjArraytoApproval)
  let ws_mailAddress = ss.getSheetByName("Database for Web");
  let dataApproval = ws_mailAddress.getSheetValues(
    1,
    1,
    ws_mailAddress.getLastRow(),
    ws_mailAddress.getLastColumn()
  );
  let headApproval = dataApproval[0];
  // console.log(headApproval)

  let ws_authorization = ss.getSheetByName("Authorization settings");
  let dataAuthorization = ws_authorization.getSheetValues(
    2,
    1,
    ws_authorization.getLastRow() - 1,
    ws_authorization.getLastColumn()
  );
  let headAuthorization = dataAuthorization[0];
  let objArrAuthorization = [];
  for (i = 1; i < dataAuthorization.length; i++) {
    let obj = {};
    for (j = 0; j < headAuthorization.length; j++) {
      obj[headAuthorization[j]] = dataAuthorization[i][j];
    }
    objArrAuthorization.push(obj);
  }
  // console.log(objArrAuthorization)

  let objArrayEmail = [];
  for (i = 1; i < dataApproval.length; i++) {
    let obj = {};
    for (j = 0; j < headApproval.length; j++) {
      obj[headApproval[j]] = dataApproval[i][j];
    }
    objArrayEmail.push(obj);
  }
  // console.log(objArrayEmail)

  let userEmail = Session.getActiveUser().getEmail();
  let result = [
    objArraytoApproval,
    objArrayEmail,
    userEmail,
    objArrAuthorization,
  ];
  // console.log(result);
  return result;
}

function saveCommet1(r) {
  let submitMail = r[2];
  let comment = r[1];
  let machineType = r[3];
  let reason = r[4];

  let id = "1bYKTK5a63yJWRHzM_UPP6b4hwF67eZKEM5dCKLWR59U";

  let ss = SpreadsheetApp.openById(id);

  let ws_Tasklisthistory = ss.getSheetByName("Tasklist_history");

  let dataValues = ws_Tasklisthistory.getRange("C:C").getValues();

  let rowNumber =
    dataValues.findIndex(function (row) {
      return row[0] === r[0];
    }) + 1; // 因为行号是基于1的索引
  ws_Tasklisthistory.getRange(rowNumber, 8).setValue(comment);

  let subject =
    "任务清单变更申请 -- 审批意见/ Tasklist MoC Application -- Comment";
  let bodyHtml = "";
  bodyHtml += "<p style='font-size:15px;margin:0 0 12px'>您提交的任务清单审反馈意见如下 / The feedback on your submitted tasklist is as follows:</p>";
  bodyHtml += _buildMoCInfoTable(
    ["机型/ Machine Type", "任务类型/ Task Type", "变更原因/ Change Reason", "申请人/ Applier", "修改意见/ Comment"],
    [[machineType, "保养/ PM", reason, submitMail, comment]]
  );
  bodyHtml += "<p style='font-size:13px;margin-top:16px'>您可以点击下面的链接来登录系统：<br><a href='https://script.google.com/a/macros/colpal.com/s/AKfycbxpDYL02i5FaFzUDcIoW3siG2U94cvWUUnz_F5x2BO1jnrXoMGzFQH-jw9C4nvZ7FE/exec'>任务清单变更管理/ Tasklist MoC</a></p>";
  GmailApp.sendEmail(submitMail, subject, "", { htmlBody: _buildMoCEmailShell(subject, bodyHtml) });
  // console.log(userEmail);
  return true;
}

function save_Production_Commet(r) {
  let submitMail = r[2];
  let comment = r[1];
  let machineType = r[3];
  let reason = r[4];

  let id = "1bYKTK5a63yJWRHzM_UPP6b4hwF67eZKEM5dCKLWR59U";

  let ss = SpreadsheetApp.openById(id);

  let ws_Tasklisthistory = ss.getSheetByName("Tasklist_history");

  let dataValues = ws_Tasklisthistory.getRange("C:C").getValues();

  let rowNumber =
    dataValues.findIndex(function (row) {
      return row[0] === r[0];
    }) + 1; // 因为行号是基于1的索引
  ws_Tasklisthistory.getRange(rowNumber, 6).setValue(comment);

  let subject =
    "任务清单变更申请 -- 班组意见/ Tasklist MoC Application -- Production Comment";
  let bodyHtml = "";
  bodyHtml += "<p style='font-size:15px;margin:0 0 12px'>您提交的任务清单审反馈意见如下 / The feedback on your submitted tasklist is as follows:</p>";
  bodyHtml += _buildMoCInfoTable(
    ["机型/ Machine Type", "任务类型/ Task Type", "变更原因/ Change Reason", "申请人/ Applier", "修改意见/ Comment"],
    [[machineType, "点检/ Inspection", reason, submitMail, comment]]
  );
  bodyHtml += "<p style='font-size:13px;margin-top:16px'>您可以点击下面的链接来登录系统：<br><a href='https://script.google.com/a/macros/colpal.com/s/AKfycbxpDYL02i5FaFzUDcIoW3siG2U94cvWUUnz_F5x2BO1jnrXoMGzFQH-jw9C4nvZ7FE/exec'>任务清单变更管理/ Tasklist MoC</a></p>";
  GmailApp.sendEmail(submitMail, subject, "", { htmlBody: _buildMoCEmailShell(subject, bodyHtml) });
  // console.log(userEmail);
  return true;
}

function saveCommet1_IN(r) {
  let submitMail = r[2];
  let comment = r[1];
  let machineType = r[3];
  let reason = r[4];

  let id = "1RQql-PrcBWiAQNeg7hQKcocpllSUMRhT5XPrDTVWoBY";
  let ss = SpreadsheetApp.openById(id);
  let ws_Tasklisthistory = ss.getSheetByName("Tasklist_history");
  let dataValues = ws_Tasklisthistory.getRange("C:C").getValues();
  let rowNumber =
    dataValues.findIndex(function (row) {
      return row[0] === r[0];
    }) + 1; // 因为行号是基于1的索引
  ws_Tasklisthistory.getRange(rowNumber, 8).setValue(comment);

  let subject =
    "任务清单变更申请 -- 审批意见/ Tasklist MoC Application -- Comment";
  let bodyHtml = "";
  bodyHtml += "<p style='font-size:15px;margin:0 0 12px'>您提交的任务清单审反馈意见如下 / The feedback on your submitted tasklist is as follows:</p>";
  bodyHtml += _buildMoCInfoTable(
    ["机型/ Machine Type", "任务类型/ Task Type", "变更原因/ Change Reason", "申请人/ Applier", "修改意见/ Comment"],
    [[machineType, "点检/ Inspection", reason, submitMail, comment]]
  );
  bodyHtml += "<p style='font-size:13px;margin-top:16px'>您可以点击下面的链接来登录系统：<br><a href='https://script.google.com/a/macros/colpal.com/s/AKfycbxpDYL02i5FaFzUDcIoW3siG2U94cvWUUnz_F5x2BO1jnrXoMGzFQH-jw9C4nvZ7FE/exec'>任务清单变更管理/ Tasklist MoC</a></p>";
  GmailApp.sendEmail(submitMail, subject, "", { htmlBody: _buildMoCEmailShell(subject, bodyHtml) });
  return true;
}

function saveCommet2(r) {
  let submitMail = r[2];
  let comment = r[1];
  let machineType = r[3];
  let reason = r[4];

  let id = "1bYKTK5a63yJWRHzM_UPP6b4hwF67eZKEM5dCKLWR59U";

  let ss = SpreadsheetApp.openById(id);

  let ws_Tasklisthistory = ss.getSheetByName("Tasklist_history");

  let dataValues = ws_Tasklisthistory.getRange("C:C").getValues();

  let rowNumber =
    dataValues.findIndex(function (row) {
      return row[0] === r[0];
    }) + 1; // 因为行号是基于1的索引
  ws_Tasklisthistory.getRange(rowNumber, 10).setValue(comment);

  let subject =
    "任务清单变更申请 -- 审批意见/ Tasklist MoC Application -- Comment";
  let bodyHtml = "";
  bodyHtml += "<p style='font-size:15px;margin:0 0 12px'>您提交的任务清单审反馈意见如下 / The feedback on your submitted tasklist is as follows:</p>";
  bodyHtml += _buildMoCInfoTable(
    ["机型/ Machine Type", "任务类型/ Task Type", "变更原因/ Change Reason", "申请人/ Applier", "修改意见/ Comment"],
    [[machineType, "保养/ PM", reason, submitMail, comment]]
  );
  bodyHtml += "<p style='font-size:13px;margin-top:16px'>您可以点击下面的链接来登录系统：<br><a href='https://script.google.com/a/macros/colpal.com/s/AKfycbxpDYL02i5FaFzUDcIoW3siG2U94cvWUUnz_F5x2BO1jnrXoMGzFQH-jw9C4nvZ7FE/exec'>任务清单变更管理/ Tasklist MoC</a></p>";
  GmailApp.sendEmail(submitMail, subject, "", { htmlBody: _buildMoCEmailShell(subject, bodyHtml) });
  // console.log(userEmail);
  return true;
}

function save_Production_Commet_IN(r) {
  let submitMail = r[2];
  let comment = r[1];
  let machineType = r[3];
  let reason = r[4];

  let id = "1RQql-PrcBWiAQNeg7hQKcocpllSUMRhT5XPrDTVWoBY";

  let ss = SpreadsheetApp.openById(id);

  let ws_Tasklisthistory = ss.getSheetByName("Tasklist_history");

  let dataValues = ws_Tasklisthistory.getRange("C:C").getValues();

  let rowNumber =
    dataValues.findIndex(function (row) {
      return row[0] === r[0];
    }) + 1; // 因为行号是基于1的索引
  ws_Tasklisthistory.getRange(rowNumber, 6).setValue(comment);

  let subject =
    "任务清单变更申请 -- 班组意见/ Tasklist MoC Application -- Production Comment";
  let bodyHtml = "";
  bodyHtml += "<p style='font-size:15px;margin:0 0 12px'>您提交的任务清单审反馈意见如下 / The feedback on your submitted tasklist is as follows:</p>";
  bodyHtml += _buildMoCInfoTable(
    ["机型/ Machine Type", "任务类型/ Task Type", "变更原因/ Change Reason", "申请人/ Applier", "修改意见/ Comment"],
    [[machineType, "点检/ Inspection", reason, submitMail, comment]]
  );
  bodyHtml += "<p style='font-size:13px;margin-top:16px'>您可以点击下面的链接来登录系统：<br><a href='https://script.google.com/a/macros/colpal.com/s/AKfycbxpDYL02i5FaFzUDcIoW3siG2U94cvWUUnz_F5x2BO1jnrXoMGzFQH-jw9C4nvZ7FE/exec'>任务清单变更管理/ Tasklist MoC</a></p>";
  GmailApp.sendEmail(submitMail, subject, "", { htmlBody: _buildMoCEmailShell(subject, bodyHtml) });
  // console.log(userEmail);
  return true;
}

function saveCommet2_IN(r) {
  let submitMail = r[2];
  let comment = r[1];
  let machineType = r[3];
  let reason = r[4];

  let id = "1RQql-PrcBWiAQNeg7hQKcocpllSUMRhT5XPrDTVWoBY";
  let ss = SpreadsheetApp.openById(id);
  let ws_Tasklisthistory = ss.getSheetByName("Tasklist_history");
  let dataValues = ws_Tasklisthistory.getRange("C:C").getValues();
  let rowNumber =
    dataValues.findIndex(function (row) {
      return row[0] === r[0];
    }) + 1; // 因为行号是基于1的索引
  ws_Tasklisthistory.getRange(rowNumber, 10).setValue(comment);

  let subject =
    "任务清单变更申请 -- 审批意见/ Tasklist MoC Application -- Comment";
  let bodyHtml = "";
  bodyHtml += "<p style='font-size:15px;margin:0 0 12px'>您提交的任务清单审反馈意见如下 / The feedback on your submitted tasklist is as follows:</p>";
  bodyHtml += _buildMoCInfoTable(
    ["机型/ Machine Type", "任务类型/ Task Type", "变更原因/ Change Reason", "申请人/ Applier", "修改意见/ Comment"],
    [[machineType, "点检/ Inspection", reason, submitMail, comment]]
  );
  bodyHtml += "<p style='font-size:13px;margin-top:16px'>您可以点击下面的链接来登录系统：<br><a href='https://script.google.com/a/macros/colpal.com/s/AKfycbxpDYL02i5FaFzUDcIoW3siG2U94cvWUUnz_F5x2BO1jnrXoMGzFQH-jw9C4nvZ7FE/exec'>任务清单变更管理/ Tasklist MoC</a></p>";
  GmailApp.sendEmail(submitMail, subject, "", { htmlBody: _buildMoCEmailShell(subject, bodyHtml) });
  // console.log(userEmail);
  return true;
}

function saveApprove1(r) {
  let wordResult = r[1];

  let id = "1bYKTK5a63yJWRHzM_UPP6b4hwF67eZKEM5dCKLWR59U";

  let ss = SpreadsheetApp.openById(id);

  let ws_Tasklisthistory = ss.getSheetByName("Tasklist_history");

  let dataValues = ws_Tasklisthistory.getRange("C:C").getValues();

  let rowNumber =
    dataValues.findIndex(function (row) {
      return row[0] === r[0];
    }) + 1; // 因为行号是基于1的索引
  ws_Tasklisthistory.getRange(rowNumber, 7).setValue(r[1]);

  if (wordResult.includes("批准") || wordResult.includes("Approve")) {
    // console.log('批准/ Approve');
    let mailSubmit = r[2];
    let maiApproval2 = r[3];
    let machineType = r[4];
    let reason = r[5];
    // let status = "待审批/ Pending";
    let status =
      reason.includes("作废") || reason.includes("void")
        ? "作废待审批/ Void Pending"
        : "待审批/ Pending";
    ws_Tasklisthistory.getRange(rowNumber, 13).setValue(status);

    //  邮件发送给申请人
    let subjectLevel1 =
      "任务清单变更申请 -- 审批 1 通过/ Tasklist MoC Application -- Approval Level 1 Approved";
    let bodyInfo = "";
    bodyInfo += "<p style='font-size:15px;margin:0 0 12px'>您的任务清变更申请已被 / Your tasklist change application has been <span style='background-color:#198754;color:white;padding:2px 8px;border-radius:3px;font-weight:bold'>批准 / Approved</span>，下面将会发送给 / It will be sent to " + maiApproval2 + " 进行审批 / for approval</p>";
    bodyInfo += _buildMoCInfoTable(
      ["机型/ Machine Type", "任务类型/ Task Type", "变更原因/ Change Reason", "申请人/ Applier"],
      [[machineType, "保养/ PM", reason, mailSubmit]]
    );
    bodyInfo += "<p style='font-size:13px;margin-top:16px'>您可以点击下面的链接来登录系统：<br><a href='https://script.google.com/a/macros/colpal.com/s/AKfycbxpDYL02i5FaFzUDcIoW3siG2U94cvWUUnz_F5x2BO1jnrXoMGzFQH-jw9C4nvZ7FE/exec'>任务清单变更管理/ Tasklist MoC</a></p>";
    GmailApp.sendEmail(mailSubmit, subjectLevel1, "", { htmlBody: _buildMoCEmailShell(subjectLevel1, bodyInfo) });

    //  邮件发送给Approval 2
    let subjectApproval2 =
      "任务清单变更申请 -- 审批 2/ Tasklist MoC Application -- Approval Level 2";
    let bodyApproval2 = "";
    bodyApproval2 += "<p style='font-size:15px;margin:0 0 12px'>您的任务清单发生变更请审批 / Your tasklist has changes, please approve</p>";
    bodyApproval2 += _buildMoCInfoTable(
      ["机型/ Machine Type", "任务类型/ Task Type", "变更原因/ Change Reason", "申请人/ Applier"],
      [[machineType, "保养/ PM", reason, mailSubmit]]
    );
    bodyApproval2 += "<p style='font-size:13px;margin-top:16px'>您可以点击下面的链接来登录系统：<br><a href='https://script.google.com/a/macros/colpal.com/s/AKfycbxpDYL02i5FaFzUDcIoW3siG2U94cvWUUnz_F5x2BO1jnrXoMGzFQH-jw9C4nvZ7FE/exec'>任务清单变更管理/ Tasklist MoC</a></p>";
    GmailApp.sendEmail(maiApproval2, subjectApproval2, "", {
      htmlBody: _buildMoCEmailShell(subjectApproval2, bodyApproval2),
    });

    return true;
  } else {
    let status = "拒绝/ Rejected";
    ws_Tasklisthistory.getRange(rowNumber, 13).setValue(status);
    let mailSubmit = r[2];
    let machineType = r[3];
    let reason = r[5];

    let subjectReject =
      "任务清单变更申请 -- 审批 1 拒绝/ Tasklist MoC Application -- Approval Level 1 Rejected";
    let bodyHtml = "";
    bodyHtml += "<p style='font-size:15px;margin:0 0 12px'>您的任务清变更申请已被 / Your tasklist change application has been <span style='background-color:#842029;color:white;padding:2px 8px;border-radius:3px;font-weight:bold'>拒绝 / Rejected</span></p>";
    bodyHtml += _buildMoCInfoTable(
      ["机型/ Machine Type", "任务类型/ Task Type", "变更原因/ Change Reason", "申请人/ Applier"],
      [[machineType, "保养/ PM", reason, mailSubmit]]
    );
    bodyHtml += "<p style='font-size:13px;margin-top:16px'>您可以点击下面的链接来登录系统：<br><a href='https://script.google.com/a/macros/colpal.com/s/AKfycbxpDYL02i5FaFzUDcIoW3siG2U94cvWUUnz_F5x2BO1jnrXoMGzFQH-jw9C4nvZ7FE/exec'>任务清单变更管理/ Tasklist MoC</a></p>";
    GmailApp.sendEmail(mailSubmit, subjectReject, "", { htmlBody: _buildMoCEmailShell(subjectReject, bodyHtml) });
    return true;
  }
}

// PM 任务清单
function save_Production_Approve(r) {
  let wordResult = r[1];

  let id = "1bYKTK5a63yJWRHzM_UPP6b4hwF67eZKEM5dCKLWR59U";

  let ss = SpreadsheetApp.openById(id);

  let ws_Tasklisthistory = ss.getSheetByName("Tasklist_history");

  let dataValues = ws_Tasklisthistory.getRange("C:C").getValues();

  let rowNumber =
    dataValues.findIndex(function (row) {
      return row[0] === r[0];
    }) + 1; // 因为行号是基于1的索引

  ws_Tasklisthistory.getRange(rowNumber, 5).setValue(r[1]);

  if (wordResult.includes("批准/ Approve")) {
    // console.log('批准/ Approve');
    let mailSubmit = r[2];

    let maiApproval1 = r[3];

    let machineType = r[4];

    let reason = r[5];

    let status = "待审批/ Pending";

    ws_Tasklisthistory.getRange(rowNumber, 13).setValue(status);

    //  邮件发送给申请人
    let subjectLevel1 =
      "任务清单变更申请 -- 班组审批 通过/ Tasklist MoC Application -- Production Approval Approved";
    let bodyInfo = "";
    bodyInfo += "<p style='font-size:15px;margin:0 0 12px'>您的任务清变更申请已被 / Your tasklist change application has been <span style='background-color:#198754;color:white;padding:2px 8px;border-radius:3px;font-weight:bold'>批准 / Approved</span>，下面将会发送给 / It will be sent to " + maiApproval1 + " 进行审批 / for approval</p>";
    bodyInfo += _buildMoCInfoTable(
      ["机型/ Machine Type", "任务类型/ Task Type", "变更原因/ Change Reason", "申请人/ Applier"],
      [[machineType, "点检/ Inspection", reason, mailSubmit]]
    );
    bodyInfo += "<p style='font-size:13px;margin-top:16px'>您可以点击下面的链接来登录系统：<br><a href='https://script.google.com/a/macros/colpal.com/s/AKfycbxpDYL02i5FaFzUDcIoW3siG2U94cvWUUnz_F5x2BO1jnrXoMGzFQH-jw9C4nvZ7FE/exec'>任务清单变更管理/ Tasklist MoC</a></p>";
    GmailApp.sendEmail(mailSubmit, subjectLevel1, "", { htmlBody: _buildMoCEmailShell(subjectLevel1, bodyInfo) });

    //  邮件发送给Approval 1
    let subjectApproval2 =
      "任务清单变更申请 -- 审批 1/ Tasklist MoC Application -- Approval Level 1";

    let bodyHtml = "<p style='font-size:15px;margin:0 0 12px'>您的任务清单发生变更请审批 / Your tasklist has changes, please approve</p>";
    bodyHtml += _buildMoCInfoTable(
      ["机型/ Machine Type", "任务类型/ Task Type", "变更原因/ Change Reason", "申请人/ Applier"],
      [[machineType, "保养/ PM", reason, mailSubmit]]
    );
    bodyHtml += "<p style='font-size:13px;margin-top:16px'>您可以点击下面的链接来登录系统：<br><a href='https://script.google.com/a/macros/colpal.com/s/AKfycbxpDYL02i5FaFzUDcIoW3siG2U94cvWUUnz_F5x2BO1jnrXoMGzFQH-jw9C4nvZ7FE/exec'>任务清单变更管理/ Tasklist MoC</a></p>";
    GmailApp.sendEmail(maiApproval1, subjectApproval2, "", { htmlBody: _buildMoCEmailShell(subjectApproval2, bodyHtml) });

    return true;
  } else {
    let status = "拒绝/ Rejected";

    ws_Tasklisthistory.getRange(rowNumber, 13).setValue(status);

    let mailSubmit = r[2];

    let machineType = r[3];

    let reason = r[5];

    let subjectReject =
      "任务清单变更申请 -- 班组审批 拒绝/ Tasklist MoC Application -- Production Approval Rejected";
    let bodyHtml = "";
    bodyHtml += "<p style='font-size:15px;margin:0 0 12px'>您的任务清变更申请已被 / Your tasklist change application has been <span style='background-color:#842029;color:white;padding:2px 8px;border-radius:3px;font-weight:bold'>拒绝 / Rejected</span></p>";
    bodyHtml += _buildMoCInfoTable(
      ["机型/ Machine Type", "任务类型/ Task Type", "变更原因/ Change Reason", "申请人/ Applier"],
      [[machineType, "保养/ PM", reason, mailSubmit]]
    );
    bodyHtml += "<p style='font-size:13px;margin-top:16px'>您可以点击下面的链接来登录系统：<br><a href='https://script.google.com/a/macros/colpal.com/s/AKfycbxpDYL02i5FaFzUDcIoW3siG2U94cvWUUnz_F5x2BO1jnrXoMGzFQH-jw9C4nvZ7FE/exec'>任务清单变更管理/ Tasklist MoC</a></p>";
    GmailApp.sendEmail(mailSubmit, subjectReject, "", { htmlBody: _buildMoCEmailShell(subjectReject, bodyHtml) });
    return true;
  }
}

function saveApprove1_IN(r) {
  let wordResult = r[1];

  let id = "1RQql-PrcBWiAQNeg7hQKcocpllSUMRhT5XPrDTVWoBY";

  let ss = SpreadsheetApp.openById(id);

  let ws_Tasklisthistory = ss.getSheetByName("Tasklist_history");

  let dataValues = ws_Tasklisthistory.getRange("C:C").getValues();

  let rowNumber =
    dataValues.findIndex(function (row) {
      return row[0] === r[0];
    }) + 1; // 因为行号是基于1的索引

  ws_Tasklisthistory.getRange(rowNumber, 7).setValue(r[1]);

  if (wordResult.includes("批准") || wordResult.includes("Approve")) {
    let mailSubmit = r[2];

    let maiApproval2 = r[3];

    let machineType = r[4];

    let reason = r[5];

    let status =
      reason.includes("作废") || reason.includes("void")
        ? "作废待审批/ Void Pending"
        : "待审批/ Pending";

    ws_Tasklisthistory.getRange(rowNumber, 13).setValue(status);

    //  邮件发送给申请人
    let subjectLevel1 =
      "任务清单变更申请 -- 审批 1 通过/ Tasklist MoC Application -- Approval Level 1 Approved";
    let bodyInfo = "";
    bodyInfo += "<p style='font-size:15px;margin:0 0 12px'>您的任务清变更申请已被 / Your tasklist change application has been <span style='background-color:#198754;color:white;padding:2px 8px;border-radius:3px;font-weight:bold'>批准 / Approved</span>，下面将会发送给 / It will be sent to " + maiApproval2 + " 进行审批 / for approval</p>";
    bodyInfo += _buildMoCInfoTable(
      ["机型/ Machine Type", "任务类型/ Task Type", "变更原因/ Change Reason", "申请人/ Applier"],
      [[machineType, "点检/ Inspection", reason, mailSubmit]]
    );
    bodyInfo += "<p style='font-size:13px;margin-top:16px'>您可以点击下面的链接来登录系统：<br><a href='https://script.google.com/a/macros/colpal.com/s/AKfycbxpDYL02i5FaFzUDcIoW3siG2U94cvWUUnz_F5x2BO1jnrXoMGzFQH-jw9C4nvZ7FE/exec'>任务清单变更管理/ Tasklist MoC</a></p>";
    GmailApp.sendEmail(mailSubmit, subjectLevel1, "", { htmlBody: _buildMoCEmailShell(subjectLevel1, bodyInfo) });

    //  邮件发送给Approval 2
    let subjectApproval2 =
      "任务清单变更申请 -- 审批 2/ Tasklist MoC Application -- Approval Level 2";
    let bodyApproval2 = "";
    bodyApproval2 += "<p style='font-size:15px;margin:0 0 12px'>您的任务清单发生变更请审批 / Your tasklist has changes, please approve</p>";
    bodyApproval2 += _buildMoCInfoTable(
      ["机型/ Machine Type", "任务类型/ Task Type", "变更原因/ Change Reason", "申请人/ Applier"],
      [[machineType, "点检/ Inspection", reason, mailSubmit]]
    );
    bodyApproval2 += "<p style='font-size:13px;margin-top:16px'>您可以点击下面的链接来登录系统：<br><a href='https://script.google.com/a/macros/colpal.com/s/AKfycbxpDYL02i5FaFzUDcIoW3siG2U94cvWUUnz_F5x2BO1jnrXoMGzFQH-jw9C4nvZ7FE/exec'>任务清单变更管理/ Tasklist MoC</a></p>";
    GmailApp.sendEmail(maiApproval2, subjectApproval2, "", { htmlBody: _buildMoCEmailShell(subjectApproval2, bodyApproval2) });

    return true;
  } else {
    let status = "拒绝/ Rejected";
    ws_Tasklisthistory.getRange(rowNumber, 13).setValue(status);
    let mailSubmit = r[2];
    let machineType = r[3];
    let reason = r[5];
    let subjectReject =
      "任务清单变更申请 -- 审批 1 拒绝/ Tasklist MoC Application -- Approval Level 1 Rejected";
    let bodyHtml = "";
    bodyHtml += "<p style='font-size:15px;margin:0 0 12px'>您的任务清变更申请已被 / Your tasklist change application has been <span style='background-color:#842029;color:white;padding:2px 8px;border-radius:3px;font-weight:bold'>拒绝 / Rejected</span></p>";
    bodyHtml += _buildMoCInfoTable(
      ["机型/ Machine Type", "任务类型/ Task Type", "变更原因/ Change Reason", "申请人/ Applier"],
      [[machineType, "点检/ Inspection", reason, mailSubmit]]
    );
    bodyHtml += "<p style='font-size:13px;margin-top:16px'>您可以点击下面的链接来登录系统：<br><a href='https://script.google.com/a/macros/colpal.com/s/AKfycbxpDYL02i5FaFzUDcIoW3siG2U94cvWUUnz_F5x2BO1jnrXoMGzFQH-jw9C4nvZ7FE/exec'>任务清单变更管理/ Tasklist MoC</a></p>";
    GmailApp.sendEmail(mailSubmit, subjectReject, "", { htmlBody: _buildMoCEmailShell(subjectReject, bodyHtml) });
    return true;
  }
}

function saveApprove2(r) {
  let wordResult = r[1];

  let id = "1bYKTK5a63yJWRHzM_UPP6b4hwF67eZKEM5dCKLWR59U";

  let ss = SpreadsheetApp.openById(id);

  let ws_Tasklisthistory = ss.getSheetByName("Tasklist_history");

  let dataValues = ws_Tasklisthistory.getRange("C:C").getValues();

  let rowNumber =
    dataValues.findIndex(function (row) {
      return row[0] === r[0];
    }) + 1; // 因为行号是基于1的索引

  ws_Tasklisthistory.getRange(rowNumber, 9).setValue(wordResult);

  if (wordResult.includes("批准") || wordResult.includes("Approve")) {
    // console.log('批准/ Approve');
    let mailSubmit = r[2];
    let maiApproval1 = r[3];
    let machineType = r[4];
    let reason = r[5];
    let mailDisseninate = r[6];
    let status = "待发放/ Wait for Dissminater";

    ws_Tasklisthistory.getRange(rowNumber, 13).setValue(status);

    //  邮件发送给申请人 -- 需要新增CC给一级审批人
    let subjectLevel1 =
      "任务清单变更申请 -- 审批 2 通过/ Tasklist MoC Application -- Approval Level 2 Approved";
    let bodyInfo = "";
    bodyInfo += "<p style='font-size:15px;margin:0 0 12px'>您的任务清变更申请已被 / Your tasklist change application has been <span style='background-color:#198754;color:white;padding:2px 8px;border-radius:3px;font-weight:bold'>批准 / Approved</span>，下面将会发送给 / It will be sent to " + mailDisseninate + " 进行发放 / for dissemination</p>";
    bodyInfo += _buildMoCInfoTable(
      ["机型/ Machine Type", "任务类型/ Task Type", "变更原因/ Change Reason", "申请人/ Applier"],
      [[machineType, "保养/ PM", reason, mailSubmit]]
    );
    bodyInfo += "<p style='font-size:13px;margin-top:16px'>您可以点击下面的链接来登录系统：<br><a href='https://script.google.com/a/macros/colpal.com/s/AKfycbxpDYL02i5FaFzUDcIoW3siG2U94cvWUUnz_F5x2BO1jnrXoMGzFQH-jw9C4nvZ7FE/exec'>任务清单变更管理/ Tasklist MoC</a></p>";
    GmailApp.sendEmail(mailSubmit, subjectLevel1, "", {
      htmlBody: _buildMoCEmailShell(subjectLevel1, bodyInfo),
      cc: maiApproval1,
    });

    let subjectApproval2 =
      "任务清单变更申请 -- 发放/ Tasklist MoC Application -- Approval Dissminater";

    let bodyHtml = "";
    bodyHtml += "<p style='font-size:15px;margin:0 0 12px'>有一份保养任务清变更申请已被 / A PM tasklist change application has been <span style='background-color:#198754;color:white;padding:2px 8px;border-radius:3px;font-weight:bold'>批准 / Approved</span>，请进行发放 / Please disseminate</p>";
    bodyHtml += _buildMoCInfoTable(
      ["机型/ Machine Type", "任务类型/ Task Type", "变更原因/ Change Reason", "申请人/ Applier"],
      [[machineType, "保养/ PM", reason, mailSubmit]]
    );
    bodyHtml += "<p style='font-size:13px;margin-top:16px'>您可以点击下面的链接来登录系统：<br><a href='https://script.google.com/a/macros/colpal.com/s/AKfycbxpDYL02i5FaFzUDcIoW3siG2U94cvWUUnz_F5x2BO1jnrXoMGzFQH-jw9C4nvZ7FE/exec'>任务清单变更管理/ Tasklist MoC</a></p>";
    GmailApp.sendEmail(mailDisseninate, subjectApproval2, "", { htmlBody: _buildMoCEmailShell(subjectApproval2, bodyHtml) });

    return true;
  } else {
    // [operator,wordApproval,submitMail,machineType,mailApprove1,mailDisseninate];
    // console.log('拒绝');
    let status = "拒绝/ Rejected";
    let mailSubmit = r[2];
    let machineType = r[3];
    let mailApprove1 = r[4];
    let reason = r[5];

    let subjectReject =
      "任务清单变更申请 -- 审批 2 拒绝/ Tasklist MoC Application -- Approval Level 2 Rejected";
    let bodyHtml = "";
    bodyHtml += "<p style='font-size:15px;margin:0 0 12px'>您的任务清变更申请已被 / Your tasklist change application has been <span style='background-color:#842029;color:white;padding:2px 8px;border-radius:3px;font-weight:bold'>拒绝 / Rejected</span></p>";
    bodyHtml += _buildMoCInfoTable(
      ["机型/ Machine Type", "任务类型/ Task Type", "变更原因/ Change Reason", "申请人/ Applier"],
      [[machineType, "保养/ PM", reason, mailSubmit]]
    );
    bodyHtml += "<p style='font-size:13px;margin-top:16px'>您可以点击下面的链接来登录系统：<br><a href='https://script.google.com/a/macros/colpal.com/s/AKfycbxpDYL02i5FaFzUDcIoW3siG2U94cvWUUnz_F5x2BO1jnrXoMGzFQH-jw9C4nvZ7FE/exec'>任务清单变更管理/ Tasklist MoC</a></p>";
    ws_Tasklisthistory.getRange(rowNumber, 13).setValue(status);
    GmailApp.sendEmail(mailSubmit, subjectReject, "", {
      htmlBody: _buildMoCEmailShell(subjectReject, bodyHtml),
      cc: mailApprove1,
    });
    return true;
  }
}

// 点检任务清单
function save_Production_Approve_IN(r) {
  // [operator,wordApproval,submitMail,mailApprove1,machineType,reason,mailDisseninate]
  let wordResult = r[1];
  let id = "1RQql-PrcBWiAQNeg7hQKcocpllSUMRhT5XPrDTVWoBY";
  let ss = SpreadsheetApp.openById(id);
  let ws_Tasklisthistory = ss.getSheetByName("Tasklist_history");
  let dataValues = ws_Tasklisthistory.getRange("C:C").getValues();
  let rowNumber =
    dataValues.findIndex(function (row) {
      return row[0] === r[0];
    }) + 1; // 因为行号是基于1的索引
  ws_Tasklisthistory.getRange(rowNumber, 5).setValue(wordResult);

  if (wordResult.includes("批准/ Approve")) {
    // console.log('批准/ Approve');
    let mailSubmit = r[2];
    let maiApproval1 = r[3];
    let machineType = r[4];
    let reason = r[5];
    let mailDisseninate = r[6];
    let status = "待审批/ Pending";

    ws_Tasklisthistory.getRange(rowNumber, 13).setValue(status);

    //----临时注释------//
    //  邮件发送给申请人
    let subjectLevel1 =
      "任务清单变更申请 -- 班组审批 通过/ Tasklist MoC Application -- Production Approval Approved";
    let bodyInfo = "";
    bodyInfo += "<p style='font-size:15px;margin:0 0 12px'>您的任务清变更申请已被 / Your tasklist change application has been <span style='background-color:#198754;color:white;padding:2px 8px;border-radius:3px;font-weight:bold'>批准 / Approved</span>，下面将会发送给 / It will be sent to " + maiApproval1 + " 进行审批 / for approval</p>";
    bodyInfo += _buildMoCInfoTable(
      ["机型/ Machine Type", "任务类型/ Task Type", "变更原因/ Change Reason", "申请人/ Applier"],
      [[machineType, "点检/ Inspection", reason, mailSubmit]]
    );
    bodyInfo += "<p style='font-size:13px;margin-top:16px'>您可以点击下面的链接来登录系统：<br><a href='https://script.google.com/a/macros/colpal.com/s/AKfycbxpDYL02i5FaFzUDcIoW3siG2U94cvWUUnz_F5x2BO1jnrXoMGzFQH-jw9C4nvZ7FE/exec'>任务清单变更管理/ Tasklist MoC</a></p>";
    GmailApp.sendEmail(mailSubmit, subjectLevel1, "", { htmlBody: _buildMoCEmailShell(subjectLevel1, bodyInfo) });

    //  邮件发送给Approval Level 1

    let subjectApproval2 =
      "任务清单变更申请 -- 审批 1/ Tasklist MoC Application -- Approval Level 1";

    let bodyHtml = "<p style='font-size:15px;margin:0 0 12px'>您的任务清单发生变更请审批 / Your tasklist has changes, please approve</p>";
    bodyHtml += _buildMoCInfoTable(
      ["机型/ Machine Type", "任务类型/ Task Type", "变更原因/ Change Reason", "申请人/ Applier"],
      [[machineType, "点检/ Inspection", reason, mailSubmit]]
    );
    bodyHtml += "<p style='font-size:13px;margin-top:16px'>您可以点击下面的链接来登录系统：<br><a href='https://script.google.com/a/macros/colpal.com/s/AKfycbxpDYL02i5FaFzUDcIoW3siG2U94cvWUUnz_F5x2BO1jnrXoMGzFQH-jw9C4nvZ7FE/exec'>任务清单变更管理/ Tasklist MoC</a></p>";
    GmailApp.sendEmail(maiApproval1, subjectApproval2, "", {
      htmlBody: _buildMoCEmailShell(subjectApproval2, bodyHtml),
      cc: mailSubmit,
    });

    //------临时注释结束------//

    return true;
  } else {
    // [operator,wordApproval,submitMail,machineType,mailApprove1,,reason,mailDisseninate];
    // console.log('拒绝');
    let status = "拒绝/ Rejected";
    let mailSubmit = r[2];
    let machineType = r[3];
    let mailApprove1 = r[4];
    let reason = r[5];
    let subjectReject =
      "任务清单变更申请 -- 班组审批 拒绝/ Tasklist MoC Application -- Production Approval Rejected";
    let bodyHtml = "";
    bodyHtml += "<p style='font-size:15px;margin:0 0 12px'>您的任务清变更申请已被 / Your tasklist change application has been <span style='background-color:#842029;color:white;padding:2px 8px;border-radius:3px;font-weight:bold'>拒绝 / Rejected</span></p>";
    bodyHtml += _buildMoCInfoTable(
      ["机型/ Machine Type", "任务类型/ Task Type", "变更原因/ Change Reason", "申请人/ Applier"],
      [[machineType, "点检/ Inspection", reason, mailSubmit]]
    );
    bodyHtml += "<p style='font-size:13px;margin-top:16px'>您可以点击下面的链接来登录系统：<br><a href='https://script.google.com/a/macros/colpal.com/s/AKfycbxpDYL02i5FaFzUDcIoW3siG2U94cvWUUnz_F5x2BO1jnrXoMGzFQH-jw9C4nvZ7FE/exec'>任务清单变更管理/ Tasklist MoC</a></p>";
    ws_Tasklisthistory.getRange(rowNumber, 13).setValue(status);
    GmailApp.sendEmail(mailSubmit, subjectReject, "", { htmlBody: _buildMoCEmailShell(subjectReject, bodyHtml) });
    return true;
  }
}

function saveApprove2_IN(r) {
  // [operator,wordApproval,submitMail,mailApprove1,machineType,reason,mailDisseninate]
  let wordResult = r[1];
  let id = "1RQql-PrcBWiAQNeg7hQKcocpllSUMRhT5XPrDTVWoBY";
  let ss = SpreadsheetApp.openById(id);
  let ws_Tasklisthistory = ss.getSheetByName("Tasklist_history");
  let dataValues = ws_Tasklisthistory.getRange("C:C").getValues();
  let rowNumber =
    dataValues.findIndex(function (row) {
      return row[0] === r[0];
    }) + 1; // 因为行号是基于1的索引
  ws_Tasklisthistory.getRange(rowNumber, 9).setValue(wordResult);

  if (wordResult.includes("批准") || wordResult.includes("Approve")) {
    let mailSubmit = r[2];

    let maiApproval1 = r[3];

    let machineType = r[4];

    let reason = r[5];

    let mailDisseninate = r[6];

    let status = "待发放/ Wait for Dissminater";

    ws_Tasklisthistory.getRange(rowNumber, 13).setValue(status);

    //  邮件发送给申请人 -- 需要新增CC给一级审批人
    let subjectLevel1 =
      "任务清单变更申请 -- 审批 2 通过/ Tasklist MoC Application -- Approval Level 2 Approved";
    let bodyInfo = "";
    bodyInfo += "<p style='font-size:15px;margin:0 0 12px'>您的任务清变更申请已被 / Your tasklist change application has been <span style='background-color:#198754;color:white;padding:2px 8px;border-radius:3px;font-weight:bold'>批准 / Approved</span>，下面将会发送给 / It will be sent to " + mailDisseninate + " 进行发放 / for dissemination</p>";
    bodyInfo += _buildMoCInfoTable(
      ["机型/ Machine Type", "任务类型/ Task Type", "变更原因/ Change Reason", "申请人/ Applier"],
      [[machineType, "点检/ Inspection", reason, mailSubmit]]
    );
    bodyInfo += "<p style='font-size:13px;margin-top:16px'>您可以点击下面的链接来登录系统：<br><a href='https://script.google.com/a/macros/colpal.com/s/AKfycbxpDYL02i5FaFzUDcIoW3siG2U94cvWUUnz_F5x2BO1jnrXoMGzFQH-jw9C4nvZ7FE/exec'>任务清单变更管理/ Tasklist MoC</a></p>";
    GmailApp.sendEmail(mailSubmit, subjectLevel1, "", {
      htmlBody: _buildMoCEmailShell(subjectLevel1, bodyInfo),
      cc: maiApproval1,
    });
    //  邮件发送给文档分发者
    let subjectApproval2 =
      "任务清单变更申请 -- 发放/ Tasklist MoC Application -- Approval Dissminater";

    let bodyHtml = "";
    bodyHtml += "<p style='font-size:15px;margin:0 0 12px'>有一份点检任务清变更申请已被 / An Inspection tasklist change application has been <span style='background-color:#198754;color:white;padding:2px 8px;border-radius:3px;font-weight:bold'>批准 / Approved</span>，请进行发放 / Please disseminate</p>";
    bodyHtml += _buildMoCInfoTable(
      ["机型/ Machine Type", "任务类型/ Task Type", "变更原因/ Change Reason", "申请人/ Applier"],
      [[machineType, "点检/ Inspection", reason, mailSubmit]]
    );
    bodyHtml += "<p style='font-size:13px;margin-top:16px'>您可以点击下面的链接来登录系统：<br><a href='https://script.google.com/a/macros/colpal.com/s/AKfycbxpDYL02i5FaFzUDcIoW3siG2U94cvWUUnz_F5x2BO1jnrXoMGzFQH-jw9C4nvZ7FE/exec'>任务清单变更管理/ Tasklist MoC</a></p>";
    GmailApp.sendEmail(mailDisseninate, subjectApproval2, "", { htmlBody: _buildMoCEmailShell(subjectApproval2, bodyHtml) });

    return true;
  } else {
    // [operator,wordApproval,submitMail,machineType,mailApprove1,,reason,mailDisseninate];
    // console.log('拒绝');
    let status = "拒绝/ Rejected";
    let mailSubmit = r[2];
    let machineType = r[3];
    let mailApprove1 = r[4];
    let reason = r[5];

    let subjectReject =
      "任务清单变更申请 -- 审批 2 拒绝/ Tasklist MoC Application -- Approval Level 2 Rejected";
    let bodyHtml = "";
    bodyHtml += "<p style='font-size:15px;margin:0 0 12px'>您的任务清变更申请已被 / Your tasklist change application has been <span style='background-color:#842029;color:white;padding:2px 8px;border-radius:3px;font-weight:bold'>拒绝 / Rejected</span></p>";
    bodyHtml += _buildMoCInfoTable(
      ["机型/ Machine Type", "任务类型/ Task Type", "变更原因/ Change Reason", "申请人/ Applier"],
      [[machineType, "点检/ Inspection", reason, mailSubmit]]
    );
    bodyHtml += "<p style='font-size:13px;margin-top:16px'>您可以点击下面的链接来登录系统：<br><a href='https://script.google.com/a/macros/colpal.com/s/AKfycbxpDYL02i5FaFzUDcIoW3siG2U94cvWUUnz_F5x2BO1jnrXoMGzFQH-jw9C4nvZ7FE/exec'>任务清单变更管理/ Tasklist MoC</a></p>";
    ws_Tasklisthistory.getRange(rowNumber, 13).setValue(status);
    GmailApp.sendEmail(mailSubmit, subjectReject, "", {
      htmlBody: _buildMoCEmailShell(subjectReject, bodyHtml),
      cc: mailApprove1,
    });
    return true;
  }
}

function saveDissminater(r) {
  let operator = r[0];

  let wordApproval = r[1];

  let mailSubmit = r[2];

  let maiApproval1 = r[3];

  let machineType = r[4];

  let reason = r[5];

  let mailDisseninate = r[6];

  let maiApproval2 = r[7];

  let ccMail = r[8];

  let date = r[10];

  let Mail_Production_Approval = r[9];

  let status =
    reason.includes("作废") || reason.includes("void")
      ? "作废/ Void"
      : "生效/ Effective";

  let id = "1bYKTK5a63yJWRHzM_UPP6b4hwF67eZKEM5dCKLWR59U";

  let ss = SpreadsheetApp.openById(id);

  let ws_Tasklisthistory = ss.getSheetByName("Tasklist_history");

  let dataValues = ws_Tasklisthistory.getRange("C:C").getValues();

  let rowNumber =
    dataValues.findIndex(function (row) {
      return row[0] === operator;
    }) + 1; // 因为行号是基于1的索引

  let dataforHistory = ws_Tasklisthistory.getSheetValues(
    1,
    1,
    ws_Tasklisthistory.getLastRow() - 1,
    ws_Tasklisthistory.getLastColumn()
  );

  let rowNumber_former;

  if (reason.includes("作废") || reason.includes("void")) {
    rowNumber_former =
      dataforHistory.findIndex(function (r) {
        return r[0] === machineType && r[12] == "生效/ Effective";
      }) + 1;

    console.log("rowNumber_former:" + rowNumber_former);

    ws_Tasklisthistory.getRange(rowNumber, 12).setValue(wordApproval);

    if (rowNumber_former > 1) {
      ws_Tasklisthistory.getRange(rowNumber_former, 13).setValue("作废/ Void");
    } else {
      console.log("rowNumber_formeri <= 1");
    }
  } else {
    rowNumber_former =
      dataforHistory.findIndex(function (r) {
        return r[0] === machineType && r[12] == "生效/ Effective";
      }) + 1;

    console.log("rowNumber_former:" + rowNumber_former);

    ws_Tasklisthistory.getRange(rowNumber, 12).setValue(wordApproval);

    if (rowNumber_former > 1) {
      ws_Tasklisthistory
        .getRange(rowNumber_former, 13)
        .setValue("取代/ Replace");
    } else {
      console.log("rowNumber_formeri <= 1");
    }
  }

  ws_Tasklisthistory.getRange(rowNumber, 13).setValue(status);

  let ccList =
    maiApproval1 +
    "," +
    maiApproval2 +
    "," +
    mailDisseninate +
    "," +
    ccMail +
    "," +
    Mail_Production_Approval;

  //  邮件发送给申请人 -- 需要新增CC给一级审批人
  let subjectDissminater =
    "任务清单变更申请 -- 生效/ Tasklist MoC Application -- Effective";
  let bodyInfo = "";
  bodyInfo += "<p style='font-size:15px;margin:0 0 12px'>您的任务清变更申请已被 / Your tasklist change application has been <span style='background-color:#198754;color:white;padding:2px 8px;border-radius:3px;font-weight:bold'>发放 / Disseminated</span>，将于下面的日期生效 / Will take effect on the date below</p>";
  bodyInfo += _buildMoCInfoTable(
    ["机型/ Machine Type", "任务类型/ Task Type", "变更原因/ Change Reason", "申请人/ Applier", "生效日期/ Effective Date"],
    [[machineType, "保养/ PM", reason, mailSubmit, date]]
  );
  bodyInfo += "<p style='font-size:13px;margin-top:16px'>您可以点击下面的链接来登录系统：<br><a href='https://script.google.com/a/macros/colpal.com/s/AKfycbxpDYL02i5FaFzUDcIoW3siG2U94cvWUUnz_F5x2BO1jnrXoMGzFQH-jw9C4nvZ7FE/exec'>任务清单变更管理/ Tasklist MoC</a></p>";
  GmailApp.sendEmail(mailSubmit, subjectDissminater, "", {
    htmlBody: _buildMoCEmailShell(subjectDissminater, bodyInfo),
    cc: ccList,
  });

  return true;
}

function saveDissminater_IN(r) {
  let operator = r[0];

  let wordApproval = r[1];

  let mailSubmit = r[2];

  let maiApproval1 = r[3];

  let machineType = r[4];

  let reason = r[5];

  let mailDisseninate = r[6];

  let maiApproval2 = r[7];

  let ccMail = r[8];

  let date = r[9];

  let status =
    reason.includes("作废") || reason.includes("void")
      ? "作废/ Void"
      : "生效/ Effective";

  let id = "1RQql-PrcBWiAQNeg7hQKcocpllSUMRhT5XPrDTVWoBY";

  let ss = SpreadsheetApp.openById(id);

  let ws_Tasklisthistory = ss.getSheetByName("Tasklist_history");

  let dataValues = ws_Tasklisthistory.getRange("C:C").getValues();

  let rowNumber =
    dataValues.findIndex(function (row) {
      return row[0] === operator;
    }) + 1; // 因为行号是基于1的索引

  let dataforHistory = ws_Tasklisthistory.getSheetValues(
    1,
    1,
    ws_Tasklisthistory.getLastRow() - 1,
    ws_Tasklisthistory.getLastColumn()
  );

  let rowNumber_former;

  if (reason.includes("作废") || reason.includes("void")) {
    rowNumber_former =
      dataforHistory.findIndex(function (r) {
        return r[0] === machineType && r[12] == "生效/ Effective";
      }) + 1;

    ws_Tasklisthistory.getRange(rowNumber, 12).setValue(wordApproval);

    if (rowNumber_former > 1) {
      ws_Tasklisthistory.getRange(rowNumber_former, 13).setValue("作废/ Void");
    } else {
      console.log("rowNumber_formeri <= 1");
    }
  } else {
    rowNumber_former =
      dataforHistory.findIndex(function (r) {
        return r[0] === machineType && r[12] == "生效/ Effective";
      }) + 1;

    console.log("rowNumber_former:" + rowNumber_former);

    ws_Tasklisthistory.getRange(rowNumber, 12).setValue(wordApproval);

    if (rowNumber_former > 1) {
      ws_Tasklisthistory
        .getRange(rowNumber_former, 13)
        .setValue("取代/ Replace");
    } else {
      console.log("rowNumber_formeri <= 1");
    }
  }

  ws_Tasklisthistory.getRange(rowNumber, 13).setValue(status);

  let ccList =
    maiApproval1 + "," + maiApproval2 + "," + mailDisseninate + "," + ccMail;
  //  邮件发送给申请人 -- 需要新增CC给一级审批人
  let subjectDissminater =
    "任务清单变更申请 -- 生效/ Tasklist MoC Application -- Effective";
  let bodyInfo = "";
  bodyInfo += "<p style='font-size:15px;margin:0 0 12px'>您的任务清变更申请已被 / Your tasklist change application has been <span style='background-color:#198754;color:white;padding:2px 8px;border-radius:3px;font-weight:bold'>发放 / Disseminated</span>，将于下面的日期生效 / Will take effect on the date below</p>";
  bodyInfo += _buildMoCInfoTable(
    ["机型/ Machine Type", "任务类型/ Task Type", "变更原因/ Change Reason", "申请人/ Applier", "生效日期/ Effective Date"],
    [[machineType, "点检/ Inspection", reason, mailSubmit, date]]
  );
  bodyInfo += "<p style='font-size:13px;margin-top:16px'>您可以点击下面的链接来登录系统：<br><a href='https://script.google.com/a/macros/colpal.com/s/AKfycbxpDYL02i5FaFzUDcIoW3siG2U94cvWUUnz_F5x2BO1jnrXoMGzFQH-jw9C4nvZ7FE/exec'>任务清单变更管理/ Tasklist MoC</a></p>";
  GmailApp.sendEmail(mailSubmit, subjectDissminater, "", {
    htmlBody: _buildMoCEmailShell(subjectDissminater, bodyInfo),
    cc: ccList,
  });

  return true;
}

function submitRequest(r) {
  // console.log(r)
  // let dataforHistory = [machineType,currentData,loginInfo,reason,status]
  let id = "1bYKTK5a63yJWRHzM_UPP6b4hwF67eZKEM5dCKLWR59U";
  let ss = SpreadsheetApp.openById(id);
  let ws_Tasklisthistory = ss.getSheetByName("Tasklist_history");
  let ws_mailAddress = ss.getSheetByName("Database for Web");

  let objBasicInfo = r[0];
  let dataforHistory = r[1];

  let machineType = dataforHistory[0];
  let currentData = dataforHistory[1];
  let loginInfo = dataforHistory[2];
  let reason = dataforHistory[3];
  let status = dataforHistory[4];
  let submitEmail = Session.getActiveUser().getEmail();
  let process = r[2];

  // console.log(objBasicInfo.Mail_CC);
  ws_Tasklisthistory.appendRow([
    machineType,
    currentData,
    loginInfo,
    reason,
    "",
    "",
    "",
    "",
    "",
    "",
    objBasicInfo.judge_Production_Approval,
    "",
    status,
    submitEmail,
    process,
  ]);

  ws_mailAddress.appendRow([
    objBasicInfo.MachineType,
    objBasicInfo.Process,
    objBasicInfo.Mail_Approve1,
    objBasicInfo.Mail_Approve2,
    objBasicInfo.Mail_Disseninate,
    objBasicInfo.Mail_CC,
    objBasicInfo.Mail_production_Approval,
  ]);

  let recipient;

  if (objBasicInfo.judge_Production_Approval == "Y") {
    recipient = objBasicInfo.Mail_production_Approval;
  } else {
    recipient = objBasicInfo.Mail_Approve1;
  }

  //  邮件发送给approvel1
  let subject =
    "任务清单变更申请 - 保养/ Tasklist MoC Application - PM";
  let bodyHtml = "";
  bodyHtml += "<p style='font-size:15px;margin:0 0 12px'>您有新的保养任务清单创建，需要您的审批： / A new PM tasklist has been created and needs your approval:</p>";
  bodyHtml += _buildMoCInfoTable(
    ["机型/ Machine Type", "任务类型/ Task Type", "新建原因/ Create Reason", "申请人/ Applier"],
    [[machineType, "保养/ PM", reason, submitEmail]]
  );
  bodyHtml += "<p style='font-size:13px;margin-top:16px'>您可以点击下面的链接来登录系统：<br><a href='https://script.google.com/a/macros/colpal.com/s/AKfycbxpDYL02i5FaFzUDcIoW3siG2U94cvWUUnz_F5x2BO1jnrXoMGzFQH-jw9C4nvZ7FE/exec'>任务清单变更管理/ Tasklist MoC</a></p>";
  GmailApp.sendEmail(recipient, subject, "", { htmlBody: _buildMoCEmailShell(subject, bodyHtml) });

  return true;
}

function submitRequest_IN(r) {
  // console.log(r)
  // let dataforHistory = [machineType,currentData,loginInfo,reason,status,process]
  let id = "1RQql-PrcBWiAQNeg7hQKcocpllSUMRhT5XPrDTVWoBY";
  let ss = SpreadsheetApp.openById(id);
  let ws_Tasklisthistory = ss.getSheetByName("Tasklist_history");
  let ws_mailAddress = ss.getSheetByName("Database for Web");

  let objBasicInfo = r[0];
  let dataforHistory = r[1];

  let machineType = dataforHistory[0];
  let currentData = dataforHistory[1];
  let loginInfo = dataforHistory[2];
  let reason = dataforHistory[3];
  let status = dataforHistory[4];
  let process = dataforHistory[5];
  let submitEmail = Session.getActiveUser().getEmail();

  // console.log(objBasicInfo.Mail_CC);
  ws_Tasklisthistory.appendRow([
    machineType,
    currentData,
    loginInfo,
    reason,
    "",
    "",
    "",
    "",
    "",
    "",
    objBasicInfo.judge_Production_Approval,
    "",
    status,
    submitEmail,
    process,
  ]);

  ws_mailAddress.appendRow([
    objBasicInfo.MachineType,
    objBasicInfo.Process,
    objBasicInfo.Mail_Approve1,
    objBasicInfo.Mail_Approve2,
    objBasicInfo.Mail_Disseninate,
    objBasicInfo.Mail_CC,
    objBasicInfo.Mail_production_Approval,
  ]);

  let recipient;

  if (objBasicInfo.judge_Production_Approval == "Y") {
    recipient = objBasicInfo.Mail_production_Approval;
  } else {
    recipient = objBasicInfo.Mail_Approve1;
  }

  //  邮件发送给approvel1
  let subject =
    "任务清单变更申请 - 点检/ Tasklist MoC Application - Inspection";
  let bodyHtml = "";
  bodyHtml += "<p style='font-size:15px;margin:0 0 12px'>您有新的点检任务清单创建，需要您的审批： / A new Inspection tasklist has been created and needs your approval:</p>";
  bodyHtml += _buildMoCInfoTable(
    ["机型/ Machine Type", "任务类型/ Task Type", "新建原因/ Create Reason", "申请人/ Applier"],
    [[machineType, "点检/ Inspection", reason, submitEmail]]
  );
  bodyHtml += "<p style='font-size:13px;margin-top:16px'>您可以点击下面的链接来登录系统：<br><a href='https://script.google.com/a/macros/colpal.com/s/AKfycbxpDYL02i5FaFzUDcIoW3siG2U94cvWUUnz_F5x2BO1jnrXoMGzFQH-jw9C4nvZ7FE/exec'>任务清单变更管理/ Tasklist MoC</a></p>";
  GmailApp.sendEmail(recipient, subject, "", { htmlBody: _buildMoCEmailShell(subject, bodyHtml) });

  return true;
}

function getEffectiveData() {
  let id = "1bYKTK5a63yJWRHzM_UPP6b4hwF67eZKEM5dCKLWR59U";
  let ss = SpreadsheetApp.openById(id);
  let ws_Tasklisthistory = ss.getSheetByName("Tasklist_history");
  let data = ws_Tasklisthistory.getSheetValues(
    2,
    1,
    ws_Tasklisthistory.getLastRow(),
    ws_Tasklisthistory.getLastColumn()
  );
  let head = ws_Tasklisthistory.getSheetValues(
    1,
    1,
    1,
    ws_Tasklisthistory.getLastColumn()
  );
  // console.log(head[0]);

  let objArraytoApproval = [];
  for (i = 0; i < data.length; i++) {
    let obj = {};
    for (j = 0; j < head[0].length; j++) {
      obj[head[0][j]] = data[i][j];
    }
    objArraytoApproval.push(obj);
  }
  console.log(objArraytoApproval);
  let userEmail = Session.getActiveUser().getEmail();
  let result = [objArraytoApproval, userEmail];
  return result;
}

function getEffectiveData_IN() {
  let id = "1RQql-PrcBWiAQNeg7hQKcocpllSUMRhT5XPrDTVWoBY";
  let ss = SpreadsheetApp.openById(id);
  let ws_Tasklisthistory = ss.getSheetByName("Tasklist_history");
  let data = ws_Tasklisthistory.getSheetValues(
    2,
    1,
    ws_Tasklisthistory.getLastRow(),
    ws_Tasklisthistory.getLastColumn()
  );
  let head = ws_Tasklisthistory.getSheetValues(
    1,
    1,
    1,
    ws_Tasklisthistory.getLastColumn()
  );
  // console.log(head[0]);

  let objArraytoApproval = [];
  for (i = 0; i < data.length; i++) {
    let obj = {};
    for (j = 0; j < head[0].length; j++) {
      obj[head[0][j]] = data[i][j];
    }
    objArraytoApproval.push(obj);
  }
  console.log(objArraytoApproval);
  let userEmail = Session.getActiveUser().getEmail();
  let result = [objArraytoApproval, userEmail];
  return result;
}

function getPasswordData() {
  let id = "1F7G3WOY5xM4fEYZ1s5RKulY4kJhqCZ9HefthmiVkraM";
  let ss = SpreadsheetApp.openById(id);
  // let ws = ss.getSheetByName("Tasklist_MoC");
  let ws = ss.getSheetByName("userID");
  let data = ws.getSheetValues(2, 1, ws.getLastRow() - 1, ws.getLastColumn());

  let userEmail = Session.getActiveUser().getEmail();
  let objArray = [];
  data.forEach((r) => {
    let objData = {};
    objData.JobNumber = r[0];
    objData.Name = r[1];
    objData.PWD = r[2];
    objData.Authorization = r[50];
    objData.Process = r[49];
    objData.Email = r[9];
    // console.log(objData)
    objArray.push(objData);
  });
  let result = [objArray, userEmail];
  console.log(objArray);
  return result;
}

/* [已停用] report()
function report() {
  //获取邮件地址
  let id = "1bYKTK5a63yJWRHzM_UPP6b4hwF67eZKEM5dCKLWR59U";
  let ss = SpreadsheetApp.openById(id);
  let ws_inforList = ss.getSheetByName("Tasklist MoC Report InfomNameList");
  let mailList = ws_inforList.getSheetValues(
    2,
    1,
    ws_inforList.getLastRow() - 1,
    ws_inforList.getLastColumn()
  );
  //获取当前Tasklist MoC内容
  let ws_taskListHistory = ss.getSheetByName("Tasklist_history");
  let tasklistHistory = ws_taskListHistory.getSheetValues(
    2,
    1,
    ws_taskListHistory.getLastRow() - 1,
    ws_taskListHistory.getLastColumn()
  );

  // console.log('tasklistHistory', tasklistHistory)

  let id_IN = "1RQql-PrcBWiAQNeg7hQKcocpllSUMRhT5XPrDTVWoBY";
  let ss_IN = SpreadsheetApp.openById(id_IN);
  let ws_taskListHistory_IN = ss_IN.getSheetByName("Tasklist_history");
  let tasklistHistory_IN = ws_taskListHistory_IN.getSheetValues(
    2,
    1,
    ws_taskListHistory_IN.getLastRow() - 1,
    ws_taskListHistory_IN.getLastColumn()
  );

  // console.log('tasklistHistory_IN', tasklistHistory_IN)

  let keyWord_INJ = "INJ";
  let keyWord_IM = "IM";
  let keyWord_TF = "TF";
  let keyWord_PK = "PK";
  let count_IM_IN = 0;
  let count_TF_IN = 0;
  let count_PK_IN = 0;
  let count_ongoing_IM_IN = 0;
  let count_ongoing_TF_IN = 0;
  let count_ongoing_PK_IN = 0;
  for (let i = 0; i < tasklistHistory_IN.length; i++) {
    for (let j = 0; j < tasklistHistory_IN[i].length; j++) {
      // console.log(tasklistHistory[i][6])
      if (
        (tasklistHistory_IN[i][j + 2] == keyWord_IM ||
          tasklistHistory_IN[i][j + 2] == keyWord_INJ) &&
        tasklistHistory_IN[i][j] === "生效/ Effective"
      ) {
        count_IM_IN++;
      } else if (
        tasklistHistory_IN[i][j + 2] == keyWord_TF &&
        tasklistHistory_IN[i][j] === "生效/ Effective"
      ) {
        count_TF_IN++;
      } else if (
        tasklistHistory_IN[i][j + 2] == keyWord_PK &&
        tasklistHistory_IN[i][j] === "生效/ Effective"
      ) {
        count_PK_IN++;
      } else if (
        (tasklistHistory_IN[i][j + 2] == keyWord_IM ||
          tasklistHistory_IN[i][j + 2] == keyWord_INJ) &&
        tasklistHistory_IN[i][j] === "待审批/ Pending"
      ) {
        count_ongoing_IM_IN++;
      } else if (
        tasklistHistory_IN[i][j + 2] == keyWord_TF &&
        tasklistHistory_IN[i][j] === "待审批/ Pending"
      ) {
        count_ongoing_TF_IN++;
      } else if (
        tasklistHistory_IN[i][j + 2] == keyWord_PK &&
        tasklistHistory_IN[i][j] === "待审批/ Pending"
      ) {
        count_ongoing_PK_IN++;
      }
    }
  }
  //对Tasklist进行处理获取到需要的邮件内容

  let count_IM = 0;
  let count_TF = 0;
  let count_PK = 0;
  let count_ongoing_IM = 0;
  let count_ongoing_TF = 0;
  let count_ongoing_PK = 0;
  for (let i = 0; i < tasklistHistory.length; i++) {
    for (let j = 0; j < tasklistHistory[i].length; j++) {
      // console.log(tasklistHistory[i][6])
      if (
        tasklistHistory[i][j + 2] == keyWord_IM &&
        tasklistHistory[i][j] === "生效/ Effective"
      ) {
        count_IM++;
      } else if (
        tasklistHistory[i][j + 2] == keyWord_TF &&
        tasklistHistory[i][j] === "生效/ Effective"
      ) {
        count_TF++;
      } else if (
        tasklistHistory[i][j + 2] == keyWord_PK &&
        tasklistHistory[i][j] === "生效/ Effective"
      ) {
        count_PK++;
      } else if (
        tasklistHistory[i][j + 2] == keyWord_IM &&
        tasklistHistory[i][j] === "待审批/ Pending"
      ) {
        count_ongoing_IM++;
      } else if (
        tasklistHistory[i][j + 2] == keyWord_TF &&
        tasklistHistory[i][j] === "待审批/ Pending"
      ) {
        count_ongoing_TF++;
      } else if (
        tasklistHistory[i][j + 2] == keyWord_PK &&
        tasklistHistory[i][j] === "待审批/ Pending"
      ) {
        count_ongoing_PK++;
      }
    }
  }

  // console.log("IM:" + count_IM, "TF:" + count_TF, "PK:" + count_PK, "IM_ongoing:" + count_ongoing_IM, "TF_ongoing:" + count_ongoing_TF, "PK_ongoing:" + count_ongoing_PK)
  //邮件内容
  let currentData = new Date();
  let year = currentData.getFullYear();
  let month = currentData.getMonth() + 1;
  let day = currentData.getDate();
  let date = year + "/" + month + "/" + day;
  let style_red =
    "style = 'font-size:14px; background-color:#842029;color:white; border: 1px solid black;''";
  let style_green =
    "style = 'font-size:14px; background-color:#198754; color:white; border: 1px solid black;'";
  let style = "";
  let htmlTable =
    '<h1 style="text-align:center;">Tasklist MoC Summary/ 任务管理系统变更总结 - ' +
    date +
    "</h1>";
  htmlTable +=
    "<table style='margin:0 auto;text-align:center;border-collapse: collapse; border: 1px solid black;'>";
  htmlTable += "<tr>";
  htmlTable +=
    '<th style="width:300px; font-size:24px; border: 1px solid black;">任务类型/ Tasklist Type</th>';
  htmlTable +=
    '<th style="width:300px; font-size:24px; border: 1px solid black;">任务状态/ Status</th>';
  htmlTable +=
    '<th style="width:300px; font-size:24px; border: 1px solid black;">注塑/ IM</th>';
  htmlTable +=
    '<th style="width:300px; font-size:24px; border: 1px solid black;">植磨毛/ TF</th>';
  htmlTable +=
    '<th style="width:300px; font-size:24px; border: 1px solid black;">包装/ PK</th>';
  htmlTable += "</tr>";
  // htmlTable += '<tr tyle="font-weight:bold; font-size:18px; border: 1px solid black;"></tr>'
  htmlTable += "<tr>";
  htmlTable +=
    '<td rowspan="2" style="font-weight:bold; font-size:18px; border: 1px solid black;">保养任务清单/ PM Tasklist</td>';
  htmlTable +=
    '<td style="font-weight:bold; font-size:18px; border: 1px solid black;">生效/ Active</td>';
  htmlTable +=
    '<td style="font-size:14px; border: 1px solid black;">' +
    count_IM +
    "</td>";
  htmlTable +=
    '<td style=" font-size:14px; border: 1px solid black;">' +
    count_TF +
    "</td>";
  htmlTable +=
    '<td style=" font-size:14px; border: 1px solid black;">' +
    count_PK +
    "</td>";
  htmlTable += "</tr>";

  htmlTable += "<tr>";
  htmlTable +=
    '<td style="font-weight:bold; font-size:18px; border: 1px solid black;">待审批/ Inactive</td>';
  if (count_ongoing_IM > 0) {
    style = style_red;
  } else {
    style = style_green;
  }
  htmlTable += "<td " + style + ">" + count_ongoing_IM + "</td > ";
  if (count_ongoing_TF > 0) {
    style = style_red;
  } else {
    style = style_green;
  }
  htmlTable += "<td " + style + "> " + count_ongoing_TF + "</td > ";
  if (count_ongoing_PK > 0) {
    style = style_red;
  } else {
    style = style_green;
  }
  htmlTable += "<td " + style + "> " + count_ongoing_PK + "</td > ";
  htmlTable += "</tr>";

  htmlTable += "<tr>";
  htmlTable +=
    '<td rowspan="2" style="font-weight:bold; font-size:18px; border: 1px solid black;">点检任务清单/ Inspection Tasklist</td>';
  htmlTable +=
    '<td style="font-weight:bold; font-size:18px; border: 1px solid black;">生效/ Active</td>';
  htmlTable +=
    '<td style="font-size:14px; border: 1px solid black;">' +
    count_IM_IN +
    "</td>";
  htmlTable +=
    '<td style=" font-size:14px; border: 1px solid black;">' +
    count_TF_IN +
    "</td>";
  htmlTable +=
    '<td style=" font-size:14px; border: 1px solid black;">' +
    count_PK_IN +
    "</td>";
  htmlTable += "</tr>";
  // htmlTable += '<tr>';
  htmlTable += "<tr>";
  htmlTable +=
    '<td style="font-weight:bold; font-size:18px; border: 1px solid black;">待审批/ Inactive</td>';
  if (count_ongoing_IM_IN > 0) {
    style = style_red;
  } else {
    style = style_green;
  }
  htmlTable += "<td " + style + ">" + count_ongoing_IM_IN + "</td > ";
  if (count_ongoing_TF_IN > 0) {
    style = style_red;
  } else {
    style = style_green;
  }
  htmlTable += "<td " + style + "> " + count_ongoing_TF_IN + "</td > ";
  if (count_ongoing_PK_IN > 0) {
    style = style_red;
  } else {
    style = style_green;
  }
  htmlTable += "<td " + style + "> " + count_ongoing_PK_IN + "</td > ";
  htmlTable += "</tr>";
  htmlTable += "</table>";
  htmlTable += "<br>";
  htmlTable +=
    '<h2 style="text-align:center; ">Active PM Tasklist/ 保养任务清单</h2>';
  htmlTable +=
    "<table style='margin:0 auto;text-align:center;border-collapse: collapse; border: 1px solid black; '>";

  htmlTable += "<tr>";
  htmlTable +=
    '<th style="width:300px; font-size:24px; border: 1px solid black;">注塑/ IM</th>';
  htmlTable +=
    '<th style="width:300px; font-size:24px; border: 1px solid black;">植磨毛/ TF</th>';
  htmlTable +=
    '<th style="width:300px; font-size:24px; border: 1px solid black;">包装/ PK</th>';
  htmlTable += "</tr>";

  let tasklist_IM = [];
  let tasklist_TF = [];
  let tasklist_PK = [];
  for (i = 0; i < tasklistHistory.length; i++) {
    if (
      tasklistHistory[i][12] == "生效/ Effective" &&
      tasklistHistory[i][14] == keyWord_IM
    ) {
      tasklist_IM.push(tasklistHistory[i][0]);
    } else if (
      tasklistHistory[i][12] == "生效/ Effective" &&
      tasklistHistory[i][14] == keyWord_TF
    ) {
      tasklist_TF.push(tasklistHistory[i][0]);
    } else if (
      tasklistHistory[i][12] == "生效/ Effective" &&
      tasklistHistory[i][14] == keyWord_PK
    ) {
      tasklist_PK.push(tasklistHistory[i][0]);
    }
  }

  let count = Math.max(count_IM, count_PK, count_TF);

  for (let i = 0; i < count; i++) {
    htmlTable += "<tr>";
    htmlTable +=
      "<td style='border: 1px solid black;'>" +
      (tasklist_IM[i] || "") +
      "</td>";
    htmlTable +=
      "<td style='border: 1px solid black;'>" +
      (tasklist_TF[i] || "") +
      "</td>";
    htmlTable +=
      "<td style='border: 1px solid black;'>" +
      (tasklist_PK[i] || "") +
      "</td>";
    htmlTable += "</tr>";
  }

  htmlTable += "</table>";

  htmlTable +=
    '<h2 style="text-align:center; ">Active Inspection Tasklist/ 点检任务清单</h2>';
  htmlTable +=
    "<table style='margin:0 auto;text-align:center;border-collapse: collapse; border: 1px solid black;'>";

  htmlTable += "<tr>";
  htmlTable +=
    '<th style="width:300px; font-size:24px; border: 1px solid black;">注塑/ IM</th>';
  htmlTable +=
    '<th style="width:300px; font-size:24px; border: 1px solid black;">植磨毛/ TF</th>';
  htmlTable +=
    '<th style="width:300px; font-size:24px; border: 1px solid black;">包装/ PK</th>';
  htmlTable += "</tr>";

  let tasklist_IM_IN = [];
  let tasklist_TF_IN = [];
  let tasklist_PK_IN = [];
  for (i = 0; i < tasklistHistory_IN.length; i++) {
    if (
      tasklistHistory_IN[i][12] == "生效/ Effective" &&
      (tasklistHistory_IN[i][14] == keyWord_IM ||
        tasklistHistory_IN[i][14] == keyWord_INJ)
    ) {
      tasklist_IM_IN.push(tasklistHistory_IN[i][0]);
    } else if (
      tasklistHistory_IN[i][12] == "生效/ Effective" &&
      tasklistHistory_IN[i][14] == keyWord_TF
    ) {
      tasklist_TF_IN.push(tasklistHistory_IN[i][0]);
    } else if (
      tasklistHistory_IN[i][12] == "生效/ Effective" &&
      tasklistHistory_IN[i][14] == keyWord_PK
    ) {
      tasklist_PK_IN.push(tasklistHistory_IN[i][0]);
    }
  }

  let count_IN = Math.max(count_IM_IN, count_PK_IN, count_TF_IN);

  for (let i = 0; i < count_IN; i++) {
    htmlTable += "<tr>";
    htmlTable +=
      "<td style='border: 1px solid black;'>" +
      (tasklist_IM_IN[i] || "") +
      "</td>";
    htmlTable +=
      "<td style='border: 1px solid black;'>" +
      (tasklist_TF_IN[i] || "") +
      "</td>";
    htmlTable +=
      "<td style='border: 1px solid black;'>" +
      (tasklist_PK_IN[i] || "") +
      "</td>";
    htmlTable += "</tr>";
  }

  htmlTable += "</table>";

  htmlTable += "<br>";
  htmlTable += "<h3>Just a soft remind </h3>";
  htmlTable +=
    '<h3 style="font-style:italic;">- Please finish the approval as soon as possible./ 请尽快完成审批</h3>';
  htmlTable +=
    '<h3 style="font-style:italic;">- Once the tasklist approved by your line manager, it will be released at the next day by department document controller./ 任务清单经经理批准后，将在第二天由部门文件管理员生效</h3>';
  htmlTable +=
    '<h3 style="font-style:italic;">- This report will run weekly./ 本报告每周发布</h3>';
  htmlTable += "<table border='1' style='margin:0 auto;text-align:center;'>";
  console.log(htmlTable);
  //发送邮件
  let subject = "Tasklist MoC System Report/ 任务变更管理系统报告 " + date;
  GmailApp.sendEmail(mailList, subject, "", { htmlBody: htmlTable });
}
*/ // [已停用] report() 结束

function getINData() {
  var id = "1RQql-PrcBWiAQNeg7hQKcocpllSUMRhT5XPrDTVWoBY";

  var ss = SpreadsheetApp.openById(id);

  var ws = ss.getSheetByName("Tasklist_history");

  var value = ws.getSheetValues(2, 1, ws.getLastRow(), ws.getLastColumn());

  var head = ws.getSheetValues(1, 1, 1, ws.getLastColumn());

  var arrays = new Array(); //创建数组

  var userEmail = Session.getActiveUser().getEmail();

  for (var i = 0; i < value.length; i++) {
    var tasklist = {}; //创建对象

    for (var j = 0; j < head[0].length; j++) {
      tasklist[head[0][j]] = value[i][j];
    }

    arrays.push(tasklist);
  }

  let result = [arrays, userEmail];

  return result;
}

// ========== 邮件 HTML 构建辅助函数 ==========

/**
 * 构建邮件外壳（红标题栏 + 内容区 + 页脚）
 * @param {string} title - 邮件标题
 * @param {string} bodyHtml - 正文 HTML
 * @returns {string} 完整邮件 HTML
 */
function _buildMoCEmailShell(title, bodyHtml) {
  var now = new Date();
  var todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  var html = '<!DOCTYPE html><html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"></head><body>';
  html += '<div style="font-family:Arial,\'Microsoft YaHei\',\'Helvetica Neue\',sans-serif;max-width:800px;margin:0 auto">';
  html += '<div style="background:#E60012;color:white;padding:14px 28px">';
  html += '<h2 style="margin:0;font-size:20px">' + title + '</h2>';
  html += '<p style="margin:4px 0 0;opacity:0.85;font-size:12px">发送时间 / Sent: ' + todayStr + '</p>';
  html += '</div>';
  html += '<div style="padding:20px 28px">';
  html += bodyHtml;
  html += '<p style="color:#bdc3c7;font-size:11px;margin-top:28px">此邮件由 任务清单变更管理系统 自动发送 / This email is auto-sent by Tasklist MoC System</p>';
  html += '</div>';
  html += '</div></body></html>';
  return html;
}

/**
 * 构建信息表格（clean CSS 风格）
 * @param {string[]} headers - 表头数组
 * @param {string[][]} rows - 数据行数组
 * @returns {string} 表格 HTML
 */
function _buildMoCInfoTable(headers, rows) {
  var html = '<table border="0" cellpadding="0" cellspacing="0" style="width:100%;font-size:13px;border-collapse:collapse;margin-top:12px">';
  html += '<tr style="background:#fde0e0;color:#333;font-weight:bold">';
  headers.forEach(function(h) {
    html += '<td style="padding:8px;text-align:center;border-bottom:1px solid #f0d0d0">' + h + '</td>';
  });
  html += '</tr>';
  rows.forEach(function(row, idx) {
    var bg = idx % 2 === 0 ? '#ffffff' : '#fff8f8';
    html += '<tr style="background:' + bg + '">';
    row.forEach(function(cell) {
      html += '<td style="padding:8px;text-align:center;border-bottom:1px solid #f5f5f5">' + cell + '</td>';
    });
    html += '</tr>';
  });
  html += '</table>';
  return html;
}

// ===== 保养策略审批 =====

// 数据表
var STRATEGY_SS_ID = "13LZMFurFP6Lc-iM0UrpNsoYDBgPHDBKVDfFxJ3G8bLs";
var STRATEGY_MASTER_SHEET_NAME = "MasterData";
var STRATEGY_HISTORY_SHEET_NAME = "History";
var STRATEGY_USERID_SS_ID = "1F7G3WOY5xM4fEYZ1s5RKulY4kJhqCZ9HefthmiVkraM";
var STRATEGY_EQU_MASTER_SS_ID = "1Iw0-TEvX0m7kIBLSmIpAkF8Z4B6Ri_nQRrmrcfPNlEQ";
var STRATEGY_EQU_MASTER_SHEET_NAME = "MasterData";
var STRATEGY_EQU_IMPORT_COLUMNS = 20;
var STRATEGY_IMPORT_OPERATOR = "系统导入";
var STRATEGY_IMPORT_REASON = "初始导入";

// 14 个业务字段（顺序同设计文档 2.1）
var STRATEGY_BUSINESS_FIELDS = [
  "工序",
  "Machine Type",
  "PM Frequency",
  "单次停机时间/ h",
  "PM Description",
  "RBM保养间隔时间",
  "RBM保养提醒间隔时间",
  "强制保养频率/ Month",
  "策略 / Strategy",
  "TasklistName",
  "是否创工单",
  "工单类型",
  "是否计入AEM",
  "备注"
];

// 主表 19 列：14 个业务字段 + 策略ID/版本号/生效时间/最后修改人/最后修改时间
var STRATEGY_MASTER_HEADERS = STRATEGY_BUSINESS_FIELDS.concat([
  "策略ID",
  "版本号",
  "生效时间",
  "最后修改人",
  "最后修改时间"
]);

// History 12 列（设计文档 2.2）
var STRATEGY_HISTORY_HEADERS = [
  "MachineType",
  "Strategy Content",
  "Operator",
  "Reason",
  "Approver1",
  "Comment1",
  "Approver2",
  "Comment2",
  "Dissminater",
  "Status",
  "submitMail",
  "Process"
];

// 状态值（设计文档 4.1）
var STRATEGY_STATUS = {
  pending: "待审批/ Pending",
  voidPending: "作废待审批/ Void Pending",
  waitRelease: "待发放/ Wait for Dissminater",
  rejected: "拒绝/ Rejected",
  effective: "生效/ Effective",
  replaced: "取代/ Replace",
  void: "作废/ Void"
};

/**
 * 展示用完整编号：策略ID + "-" + 两位版本号
 * @param {string} strategyId
 * @param {string|number} version
 * @returns {string}
 */
function strategyDisplayId_(strategyId, version) {
  var id = strategyId === null || strategyId === undefined ? "" : String(strategyId);
  return id + "-" + normalizeStrategyVersion_(version);
}

/**
 * 根据 Strategy Content 的 old/new 推断申请类型
 * @param {Object} content
 * @returns {string} "new" | "void" | "edit" | ""
 */
function strategyAction_(content) {
  var hasOld = !!(content && content.old);
  var hasNew = !!(content && content.new);
  if (hasNew && !hasOld) return "new";
  if (hasOld && !hasNew) return "void";
  if (hasOld && hasNew) return "edit";
  return "";
}

/**
 * 版本号统一为两位字符串；空值返回空字符串
 * @param {string|number} value
 * @returns {string}
 */
function normalizeStrategyVersion_(value) {
  if (value === null || value === undefined) return "";
  var text = String(value).trim();
  if (text === "") return "";
  return text.padStart(2, "0");
}

/**
 * 取现有策略ID中的最大序号 + 1，四位补零
 * @param {Array<string>} existingIds
 * @returns {string}
 */
function nextStrategyId_(existingIds) {
  var max = 0;
  (existingIds || []).forEach(function (id) {
    var text = id === null || id === undefined ? "" : String(id).trim();
    var match = text.match(/^PM-MD-(\d+)$/);
    if (match) {
      var number = parseInt(match[1], 10);
      if (number > max) max = number;
    }
  });
  return "PM-MD-" + String(max + 1).padStart(4, "0");
}

/**
 * 按表头把一行数据转为对象
 * @param {Array<string>} headers
 * @param {Array<*>} row
 * @returns {Object}
 */
function strategyRowToObject_(headers, row) {
  var result = {};
  (headers || []).forEach(function (header, index) {
    result[header] = row && index < row.length ? row[index] : "";
  });
  return result;
}

/**
 * 读取 userID 表的所有用户（第 3 行起，跳过区块标题与字段标题）
 * @returns {Array<{jobNumber:string,name:string,pwd:string,authorization:string,process:string,email:string}>}
 */
function getStrategyUsers_() {
  var ss = SpreadsheetApp.openById(STRATEGY_USERID_SS_ID);
  var ws = ss.getSheetByName("userID");
  var lastRow = ws.getLastRow();
  if (lastRow < 3) return [];
  var data = ws.getSheetValues(3, 1, lastRow - 2, ws.getLastColumn());
  return data.map(function (r) {
    return {
      jobNumber: r[0],
      name: r[1],
      pwd: r[2],
      authorization: r[50],
      process: r[49],
      // J 列 GMail 优先，为空时回退 AD 列邮箱
      email: r[9] || r[29]
    };
  });
}

/**
 * 按工号查找用户，找不到返回 null
 * @param {string|number} jobNumber
 * @returns {{jobNumber:string,name:string,pwd:string,authorization:string,process:string,email:string}|null}
 */
function getStrategyUserByJobNumber_(jobNumber) {
  var target = jobNumber === null || jobNumber === undefined ? "" : String(jobNumber).trim();
  if (target === "") return null;
  var users = getStrategyUsers_();
  for (var i = 0; i < users.length; i++) {
    var current = users[i].jobNumber;
    var text = current === null || current === undefined ? "" : String(current).trim();
    if (text === target) return users[i];
  }
  return null;
}

/**
 * 判断用户权限串中是否含指定权限
 * 同时支持原始用户（AY `authorization` 字符串）与 getStrategyUserContext 的 `permissions` 数组
 * @param {{authorization?:string,permissions?:Array<string>}} user
 * @param {string} token 权限名，如 `编辑` / `作废` / `发放`
 * @returns {boolean}
 */
function strategyHasPermission_(user, token) {
  var need = token === null || token === undefined ? "" : String(token).trim();
  if (!user || need === "") return false;
  if (Array.isArray(user.permissions)) {
    return user.permissions.map(function (item) {
      return item === null || item === undefined ? "" : String(item).trim();
    }).indexOf(need) !== -1;
  }
  var authorization = user.authorization === null || user.authorization === undefined ? "" : String(user.authorization);
  return authorization.split(",").map(function (item) {
    return item.trim();
  }).indexOf(need) !== -1;
}

/**
 * 判断用户 AX 工序范围是否覆盖目标工序（`ALL` 匹配任意工序）
 * @param {{process:string}} user
 * @param {string} process
 * @returns {boolean}
 */
function strategyProcessMatches_(user, process) {
  if (!user) return false;
  var scope = user.process === null || user.process === undefined ? "" : String(user.process).trim().toUpperCase();
  if (scope === "ALL") return true;
  var target = process === null || process === undefined ? "" : String(process).trim().toUpperCase();
  return scope !== "" && scope === target;
}

/**
 * 把用户转为审批人信息，邮箱为空时返回 null
 * @param {{name:string,email:string}} user
 * @returns {{name:string,email:string}|null}
 */
function strategyApproverInfo_(user) {
  var email = user && user.email !== null && user.email !== undefined ? String(user.email).trim() : "";
  if (email === "") return null;
  var name = user && user.name !== null && user.name !== undefined ? String(user.name).trim() : "";
  return { name: name, email: email };
}

/**
 * 按工序解析三级审批人，未配置的角色返回 null
 * @param {string} process
 * @returns {{processManager:{name:string,email:string}|null,deptManager:{name:string,email:string}|null,docControl:{name:string,email:string}|null}}
 */
function getStrategyApprovers_(process) {
  var users = getStrategyUsers_();
  var result = { processManager: null, deptManager: null, docControl: null };
  var foundProcessManager = false;
  var foundDeptManager = false;
  var foundDocControl = false;
  for (var i = 0; i < users.length; i++) {
    var user = users[i];
    if (!foundProcessManager && strategyHasPermission_(user, "策略工序经理") && strategyProcessMatches_(user, process)) {
      foundProcessManager = true;
      result.processManager = strategyApproverInfo_(user);
    }
    if (!foundDeptManager && strategyHasPermission_(user, "策略部门经理")) {
      foundDeptManager = true;
      result.deptManager = strategyApproverInfo_(user);
    }
    if (!foundDocControl && strategyHasPermission_(user, "发放")) {
      foundDocControl = true;
      result.docControl = strategyApproverInfo_(user);
    }
  }
  return result;
}

/**
 * 读取策略数据表中的一行数据并转为对象数组（跳过表头）
 * @param {string} sheetName
 * @param {Array<string>} headers
 * @returns {Array<Object>}
 */
function readStrategySheetRows_(sheetName, headers) {
  var ss = SpreadsheetApp.openById(STRATEGY_SS_ID);
  var ws = ss.getSheetByName(sheetName);
  var lastRow = ws.getLastRow();
  if (lastRow < 2) return [];
  var data = ws.getSheetValues(2, 1, lastRow - 1, headers.length);
  return data.map(function (row) {
    return strategyRowToObject_(headers, row);
  });
}

/**
 * 读取主数据表当前有效版本（一行一条策略）
 * @returns {Array<Object>}
 */
function readStrategyMasterRows_() {
  return readStrategySheetRows_(STRATEGY_MASTER_SHEET_NAME, STRATEGY_MASTER_HEADERS);
}

/**
 * 读取审批历史表（追加式，按行号升序）
 * @returns {Array<Object>}
 */
function readStrategyHistoryRows_() {
  return readStrategySheetRows_(STRATEGY_HISTORY_SHEET_NAME, STRATEGY_HISTORY_HEADERS);
}

/**
 * 生成申请人/操作人字符串
 * 格式：`工号/ JobNumber:  {jobNumber}_姓名/ Name:  {name} {timestamp}`
 * @param {string|number} jobNumber
 * @param {string} name
 * @returns {string}
 */
function getStrategyOperator_(jobNumber, name) {
  var job = jobNumber === null || jobNumber === undefined ? "" : String(jobNumber).trim();
  var personName = name === null || name === undefined ? "" : String(name).trim();
  var timestamp = Utilities.formatDate(new Date(), "Asia/Shanghai", "yyyy-MM-dd HH:mm:ss");
  return "工号/ JobNumber:  " + job + "_姓名/ Name:  " + personName + " " + timestamp;
}

/**
 * 解析 getStrategyOperator_ 生成的申请人/操作人字符串
 * @param {string} operator
 * @returns {{jobNumber:string,name:string}}
 */
function parseStrategyOperator_(operator) {
  var text = operator === null || operator === undefined ? "" : String(operator);
  var result = { jobNumber: "", name: "" };
  var jobMatch = text.match(/JobNumber:\s*([^_]+)/);
  if (jobMatch) result.jobNumber = jobMatch[1].trim();
  var nameMatch = text.match(/Name:\s*(.+)$/);
  if (nameMatch) {
    result.name = nameMatch[1].replace(/\s*\d{4}[-\/]\d{1,2}[-\/]\d{1,2}.*$/, "").trim();
  }
  return result;
}

/**
 * 判断指定策略是否存在在途申请（待审批 / 作废待审批 / 待发放）
 * @param {Array<Object>} historyRows
 * @param {string} strategyId
 * @returns {boolean}
 */
function strategyHasPendingRequest_(historyRows, strategyId) {
  var target = strategyId === null || strategyId === undefined ? "" : String(strategyId).trim();
  if (target === "") return false;
  var pendingStatuses = [
    STRATEGY_STATUS.pending,
    STRATEGY_STATUS.voidPending,
    STRATEGY_STATUS.waitRelease
  ];
  for (var i = 0; i < (historyRows || []).length; i++) {
    var row = historyRows[i] || {};
    var status = row.Status === null || row.Status === undefined ? "" : String(row.Status).trim();
    if (pendingStatuses.indexOf(status) === -1) continue;
    var content = null;
    try {
      content = JSON.parse(row["Strategy Content"]);
    } catch (e) {
      content = null;
    }
    var rowStrategyId = content && content.strategyId !== null && content.strategyId !== undefined
      ? String(content.strategyId).trim()
      : "";
    if (rowStrategyId === target) return true;
  }
  return false;
}

/**
 * 返回第一个缺失的必填业务字段，全部存在时返回空字符串
 * @param {Object} fields
 * @returns {string}
 */
function strategyMissingRequiredField_(fields) {
  var required = ["工序", "Machine Type", "PM Frequency", "PM Description", "策略 / Strategy"];
  for (var i = 0; i < required.length; i++) {
    var value = fields ? fields[required[i]] : "";
    if (value === null || value === undefined || String(value).trim() === "") return required[i];
  }
  return "";
}

/**
 * 仅保留 14 个业务字段并补空字符串
 * @param {Object} source
 * @returns {Object}
 */
function strategyBusinessSnapshot_(source) {
  var result = {};
  STRATEGY_BUSINESS_FIELDS.forEach(function (field) {
    var value = source ? source[field] : "";
    result[field] = value === null || value === undefined ? "" : value;
  });
  return result;
}

/**
 * 提交阶段邮件通知工序经理
 * @param {string} action `new` | `edit` | `void`
 * @param {Object} fields 本次申请的业务字段
 * @param {string} reason 变更原因
 * @param {string} submitMail 申请人邮箱
 * @param {{name:string,email:string}} processManager 工序经理
 */
function sendStrategySubmitMail_(action, fields, reason, submitMail, processManager) {
  var actionLabel = action === "new" ? "新建/ New" : action === "edit" ? "修改/ Modify" : "作废/ Void";
  var subject = "保养策略审批申请 - " + actionLabel;
  var row = fields || {};
  var bodyHtml = "";
  bodyHtml += "<p style='font-size:15px;margin:0 0 12px'>您有新的保养策略申请，需要您的审批： / A new PM strategy request needs your approval:</p>";
  bodyHtml += _buildMoCInfoTable(
    ["工序/ Process", "机型/ Machine Type", "保养描述/ PM Description", "申请类型/ Request Type", "变更原因/ Reason", "申请人/ Applicant"],
    [[
      row["工序"] || "",
      row["Machine Type"] || "",
      row["PM Description"] || "",
      actionLabel,
      reason,
      submitMail
    ]]
  );
  bodyHtml += "<p style='font-size:13px;margin-top:16px'>您可以点击下面的链接来登录系统：<br><a href='https://script.google.com/a/macros/colpal.com/s/AKfycbxpDYL02i5FaFzUDcIoW3siG2U94cvWUUnz_F5x2BO1jnrXoMGzFQH-jw9C4nvZ7FE/exec'>任务清单变更管理/ Tasklist MoC</a></p>";
  GmailApp.sendEmail(processManager.email, subject, "", { htmlBody: _buildMoCEmailShell(subject, bodyHtml) });
}

/**
 * 新建/修改/作废的统一提交逻辑
 * @param {Object} payload 新建 `{jobNumber,name,fields,reason}`；修改 `{jobNumber,name,strategyId,old,fields,reason}`；作废 `{jobNumber,name,strategyId,old,reason}`
 * @param {string} action `new` | `edit` | `void`
 * @returns {{ok:boolean,message?:string,operator?:string}}
 */
function createStrategyRequest_(payload, action) {
  var data = payload || {};
  var user = getStrategyUserByJobNumber_(data.jobNumber);
  if (!user) {
    return { ok: false, message: "用户不存在或未登录 / User not found" };
  }
  var requiredPermission = action === "void" ? "作废" : "编辑";
  if (!strategyHasPermission_(user, requiredPermission)) {
    return { ok: false, message: "没有" + requiredPermission + "权限 / No permission" };
  }

  var fields = action === "void" ? data.old : data.fields;
  // 作废只要求变更原因：导入的历史策略可能存在 PM Frequency / PM Description / 策略 为空的记录
  if (action !== "void") {
    var missing = strategyMissingRequiredField_(fields);
    if (missing !== "") {
      return { ok: false, message: "必填字段缺失 / Missing required field: " + missing };
    }
  }
  if (action === "void" && !data.old) {
    return { ok: false, message: "缺少基线版本 / Baseline version is required" };
  }
  var reason = data.reason === null || data.reason === undefined ? "" : String(data.reason).trim();
  if (reason === "") {
    return { ok: false, message: "变更原因必填 / Reason is required" };
  }

  var process = String(fields["工序"]).trim();
  var approvers = getStrategyApprovers_(process);
  if (!approvers.processManager || !approvers.deptManager || !approvers.docControl) {
    return { ok: false, message: "审批人未配置 / Approver not configured" };
  }

  var content;
  if (action === "new") {
    content = {
      strategyId: "",
      version: "00",
      new: strategyBusinessSnapshot_(data.fields)
    };
  } else {
    var strategyId = data.strategyId === null || data.strategyId === undefined ? "" : String(data.strategyId).trim();
    if (strategyId === "") {
      return { ok: false, message: "策略ID缺失 / Strategy ID is required" };
    }
    if (!data.old) {
      return { ok: false, message: "缺少基线版本 / Baseline version is required" };
    }
    if (strategyHasPendingRequest_(readStrategyHistoryRows_(), strategyId)) {
      return { ok: false, message: "该策略正在审批中 / Strategy is under approval" };
    }
    var masterRow = null;
    var masterRows = readStrategyMasterRows_();
    for (var i = 0; i < masterRows.length; i++) {
      var rowId = masterRows[i]["策略ID"];
      if (rowId !== null && rowId !== undefined && String(rowId).trim() === strategyId) {
        masterRow = masterRows[i];
        break;
      }
    }
    if (!masterRow) {
      return { ok: false, message: "策略不存在，请刷新后重试 / Strategy not found, please refresh" };
    }
    var baseVersion = normalizeStrategyVersion_(data.old.version);
    var masterVersion = normalizeStrategyVersion_(masterRow["版本号"]);
    if (baseVersion !== masterVersion) {
      return { ok: false, message: "策略已更新，请刷新后重试 / Strategy has been updated, please refresh" };
    }
    // 工序/机型锁定：edit 取 data.fields、void 取 data.old，都是该策略的身份字段；
    // 审批人按工序路由，前端只读不足以防止绕过页面直接调用接口
    var editedProcess = fields["工序"] === null || fields["工序"] === undefined ? "" : String(fields["工序"]).trim();
    var masterProcess = masterRow["工序"] === null || masterRow["工序"] === undefined ? "" : String(masterRow["工序"]).trim();
    var editedMachineType = fields["Machine Type"] === null || fields["Machine Type"] === undefined ? "" : String(fields["Machine Type"]).trim();
    var masterMachineType = masterRow["Machine Type"] === null || masterRow["Machine Type"] === undefined ? "" : String(masterRow["Machine Type"]).trim();
    if (editedProcess !== masterProcess || editedMachineType !== masterMachineType) {
      return { ok: false, message: "工序/机型不可修改 / Process and Machine Type cannot be changed" };
    }
    // old 基线只信主表，避免申请人伪造审批/发放差异中的「变更前」值
    var oldSnapshot = strategyBusinessSnapshot_(masterRow);
    oldSnapshot.version = normalizeStrategyVersion_(masterRow["版本号"]);
    if (action === "edit") {
      var baseNumber = parseInt(baseVersion, 10);
      if (isNaN(baseNumber)) baseNumber = 0;
      content = {
        strategyId: strategyId,
        version: String(baseNumber + 1).padStart(2, "0"),
        old: oldSnapshot,
        new: strategyBusinessSnapshot_(data.fields)
      };
    } else {
      content = {
        strategyId: strategyId,
        version: baseVersion,
        old: oldSnapshot
      };
    }
  }

  var operator = getStrategyOperator_(data.jobNumber, data.name);
  var submitMail = Session.getActiveUser().getEmail();
  var status = action === "void" ? STRATEGY_STATUS.voidPending : STRATEGY_STATUS.pending;
  var ws = SpreadsheetApp.openById(STRATEGY_SS_ID).getSheetByName(STRATEGY_HISTORY_SHEET_NAME);
  ws.appendRow([
    String(fields["Machine Type"]).trim(),
    JSON.stringify(content),
    operator,
    reason,
    "",
    "",
    "",
    "",
    "",
    status,
    submitMail,
    process
  ]);

  sendStrategySubmitMail_(action, fields, reason, submitMail, approvers.processManager);
  return { ok: true, operator: operator };
}

/**
 * 提交新策略申请
 * @param {{jobNumber:string,name:string,fields:Object,reason:string}} payload
 * @returns {{ok:boolean,message?:string,operator?:string}}
 */
function submitStrategyNew(payload) {
  return createStrategyRequest_(payload, "new");
}

/**
 * 提交策略修改申请
 * @param {{jobNumber:string,name:string,strategyId:string,old:Object,fields:Object,reason:string}} payload
 * @returns {{ok:boolean,message?:string,operator?:string}}
 */
function submitStrategyEdit(payload) {
  return createStrategyRequest_(payload, "edit");
}

/**
 * 提交策略作废申请
 * @param {{jobNumber:string,name:string,strategyId:string,old:Object,reason:string}} payload
 * @returns {{ok:boolean,message?:string,operator?:string}}
 */
function submitStrategyVoid(payload) {
  return createStrategyRequest_(payload, "void");
}

/**
 * 按 Operator 精确查找 History 行（含 1-based 行号）
 * @param {string} operator
 * @returns {{rowNumber:number,row:Object}|null}
 */
function findStrategyHistoryRow_(operator) {
  var target = operator === null || operator === undefined ? "" : String(operator).trim();
  if (target === "") return null;
  var ws = SpreadsheetApp.openById(STRATEGY_SS_ID).getSheetByName(STRATEGY_HISTORY_SHEET_NAME);
  var lastRow = ws.getLastRow();
  if (lastRow < 2) return null;
  var data = ws.getSheetValues(2, 1, lastRow - 1, STRATEGY_HISTORY_HEADERS.length);
  for (var i = 0; i < data.length; i++) {
    var current = data[i][2];
    var text = current === null || current === undefined ? "" : String(current).trim();
    if (text === target) {
      return { rowNumber: i + 2, row: strategyRowToObject_(STRATEGY_HISTORY_HEADERS, data[i]) };
    }
  }
  return null;
}

/**
 * 生成审批人列文字：`批准/ Approve {email} {timestamp}` 等
 * @param {string} decision `approve` | `reject`
 * @param {string} email 审批人邮箱
 * @param {boolean} isVoid 是否为作废单
 * @returns {string}
 */
function strategyApprovalWord_(decision, email, isVoid) {
  var person = email === null || email === undefined ? "" : String(email).trim();
  var timestamp = Utilities.formatDate(new Date(), "Asia/Shanghai", "yyyy-MM-dd HH:mm:ss");
  if (decision === "reject") {
    return "拒绝/ Reject " + person + " " + timestamp;
  }
  if (isVoid) {
    return "批准作废/ Approve to void " + person + " " + timestamp;
  }
  return "批准/ Approve " + person + " " + timestamp;
}

/**
 * 发送审批结果邮件
 * @param {{subject:string,introHtml:string,to:Array<string>,cc:string,row:Object,fields:Object,action:string}} mail
 */
function sendStrategyApprovalMail_(mail) {
  var row = mail.row || {};
  var fields = mail.fields || {};
  var actionLabel = mail.action === "new" ? "新建/ New" : mail.action === "edit" ? "修改/ Modify" : mail.action === "void" ? "作废/ Void" : "";
  var bodyHtml = mail.introHtml || "";
  bodyHtml += _buildMoCInfoTable(
    ["工序/ Process", "机型/ Machine Type", "策略描述/ PM Description", "申请类型/ Request Type", "变更原因/ Reason", "申请人/ Applicant"],
    [[
      row.Process || "",
      row.MachineType || "",
      fields["PM Description"] || "",
      actionLabel,
      row.Reason || "",
      row.submitMail || ""
    ]]
  );
  bodyHtml += "<p style='font-size:13px;margin-top:16px'>您可以点击下面的链接来登录系统：<br><a href='https://script.google.com/a/macros/colpal.com/s/AKfycbxpDYL02i5FaFzUDcIoW3siG2U94cvWUUnz_F5x2BO1jnrXoMGzFQH-jw9C4nvZ7FE/exec'>任务清单变更管理/ Tasklist MoC</a></p>";
  var htmlBody = _buildMoCEmailShell(mail.subject, bodyHtml);
  var cc = mail.cc === null || mail.cc === undefined ? "" : String(mail.cc).trim();
  (mail.to || []).forEach(function (recipient) {
    var email = recipient === null || recipient === undefined ? "" : String(recipient).trim();
    if (email === "") return;
    var options = { htmlBody: htmlBody };
    if (cc !== "") options.cc = cc;
    GmailApp.sendEmail(email, mail.subject, "", options);
  });
}

/**
 * 审批保养策略申请（工序经理 / 部门经理）
 * @param {{jobNumber:string,name:string,operator:string,level:number,decision:string,comment:string}} payload
 * @returns {{ok:boolean,message?:string}}
 */
function saveStrategyApproval(payload) {
  var data = payload || {};
  var user = getStrategyUserByJobNumber_(data.jobNumber);
  if (!user) {
    return { ok: false, message: "用户不存在或未登录 / User not found" };
  }

  var level = parseInt(data.level, 10);
  if (level !== 1 && level !== 2) {
    return { ok: false, message: "审批级别无效 / Invalid approval level" };
  }
  var decision = data.decision === null || data.decision === undefined ? "" : String(data.decision).trim();
  if (decision !== "approve" && decision !== "reject") {
    return { ok: false, message: "审批决定无效 / Invalid decision" };
  }

  var found = findStrategyHistoryRow_(data.operator);
  if (!found) {
    return { ok: false, message: "审批记录不存在 / Approval record not found" };
  }
  var row = found.row;
  var status = row.Status === null || row.Status === undefined ? "" : String(row.Status).trim();
  if (status !== STRATEGY_STATUS.pending && status !== STRATEGY_STATUS.voidPending) {
    return { ok: false, message: "该申请不在审批中 / Request is not pending approval" };
  }

  var approver1 = row.Approver1 === null || row.Approver1 === undefined ? "" : String(row.Approver1).trim();
  var approver2 = row.Approver2 === null || row.Approver2 === undefined ? "" : String(row.Approver2).trim();
  if (level === 1) {
    if (!strategyHasPermission_(user, "策略工序经理") || !strategyProcessMatches_(user, row.Process)) {
      return { ok: false, message: "没有工序经理审批权限 / No process manager permission" };
    }
    if (approver1 !== "") {
      return { ok: false, message: "工序经理已审批 / Process manager already approved" };
    }
  } else {
    if (!strategyHasPermission_(user, "策略部门经理")) {
      return { ok: false, message: "没有部门经理审批权限 / No department manager permission" };
    }
    if (approver1 === "" || approver2 !== "") {
      return { ok: false, message: "部门经理节点未开放 / Department manager node is not open" };
    }
  }

  var content = null;
  try {
    content = JSON.parse(row["Strategy Content"]);
  } catch (e) {
    content = null;
  }
  var fields = content && (content.new || content.old) ? (content.new || content.old) : {};
  var isVoid = status === STRATEGY_STATUS.voidPending;
  var approverEmail = user.email === null || user.email === undefined ? "" : String(user.email).trim();
  if (approverEmail === "") {
    approverEmail = Session.getActiveUser().getEmail();
  }

  var word = strategyApprovalWord_(decision, approverEmail, isVoid);
  var comment = data.comment === null || data.comment === undefined ? "" : String(data.comment).trim();
  var ws = SpreadsheetApp.openById(STRATEGY_SS_ID).getSheetByName(STRATEGY_HISTORY_SHEET_NAME);
  if (level === 1) {
    ws.getRange(found.rowNumber, 5).setValue(word);
    ws.getRange(found.rowNumber, 6).setValue(comment);
  } else {
    ws.getRange(found.rowNumber, 7).setValue(word);
    ws.getRange(found.rowNumber, 8).setValue(comment);
  }

  if (decision === "reject") {
    ws.getRange(found.rowNumber, 10).setValue(STRATEGY_STATUS.rejected);
  } else if (level === 2) {
    ws.getRange(found.rowNumber, 10).setValue(STRATEGY_STATUS.waitRelease);
  }

  var approvers = getStrategyApprovers_(row.Process);
  var applicantEmail = row.submitMail === null || row.submitMail === undefined ? "" : String(row.submitMail).trim();
  var processManagerEmail = approvers.processManager ? approvers.processManager.email : "";
  var deptManagerEmail = approvers.deptManager ? approvers.deptManager.email : "";
  var docControlEmail = approvers.docControl ? approvers.docControl.email : "";
  var action = strategyAction_(content);

  if (level === 1 && decision === "approve") {
    var subjectLevel1Approve = "保养策略审批 -- 工序经理批准/ PM Strategy Approval -- Process Manager Approved";
    var introLevel1Approve = "<p style='font-size:15px;margin:0 0 12px'>您的保养策略申请已被 / Your PM strategy application has been <span style='background-color:#198754;color:white;padding:2px 8px;border-radius:3px;font-weight:bold'>批准 / Approved</span>，已转交部门经理审批 / It has been forwarded to the department manager.</p>";
    sendStrategyApprovalMail_({
      subject: subjectLevel1Approve,
      introHtml: introLevel1Approve,
      to: [applicantEmail, deptManagerEmail],
      cc: "",
      row: row,
      fields: fields,
      action: action
    });
  } else if (level === 1 && decision === "reject") {
    var subjectLevel1Reject = "保养策略审批 -- 工序经理拒绝/ PM Strategy Approval -- Process Manager Rejected";
    var introLevel1Reject = "<p style='font-size:15px;margin:0 0 12px'>您的保养策略申请已被 / Your PM strategy application has been <span style='background-color:#842029;color:white;padding:2px 8px;border-radius:3px;font-weight:bold'>拒绝 / Rejected</span></p>";
    sendStrategyApprovalMail_({
      subject: subjectLevel1Reject,
      introHtml: introLevel1Reject,
      to: [applicantEmail],
      cc: "",
      row: row,
      fields: fields,
      action: action
    });
  } else if (level === 2 && decision === "approve") {
    var subjectLevel2Approve = "保养策略审批 -- 部门经理批准/ PM Strategy Approval -- Department Manager Approved";
    var introLevel2Approve = "<p style='font-size:15px;margin:0 0 12px'>您的保养策略申请已被 / Your PM strategy application has been <span style='background-color:#198754;color:white;padding:2px 8px;border-radius:3px;font-weight:bold'>批准 / Approved</span>，等待文控发放 / It is waiting for document control release.</p>";
    sendStrategyApprovalMail_({
      subject: subjectLevel2Approve,
      introHtml: introLevel2Approve,
      to: [applicantEmail, docControlEmail],
      cc: processManagerEmail,
      row: row,
      fields: fields,
      action: action
    });
  } else if (level === 2 && decision === "reject") {
    var subjectLevel2Reject = "保养策略审批 -- 部门经理拒绝/ PM Strategy Approval -- Department Manager Rejected";
    var introLevel2Reject = "<p style='font-size:15px;margin:0 0 12px'>您的保养策略申请已被 / Your PM strategy application has been <span style='background-color:#842029;color:white;padding:2px 8px;border-radius:3px;font-weight:bold'>拒绝 / Rejected</span></p>";
    sendStrategyApprovalMail_({
      subject: subjectLevel2Reject,
      introHtml: introLevel2Reject,
      to: [applicantEmail],
      cc: processManagerEmail,
      row: row,
      fields: fields,
      action: action
    });
  }

  return { ok: true };
}

/**
 * 从 Operator 解析申请人工号/姓名，供 MasterData「最后修改人」使用
 * @param {string} operator
 * @returns {string}
 */
function strategyApplicantLabel_(operator) {
  var parsed = parseStrategyOperator_(operator);
  if (parsed.jobNumber === "" && parsed.name === "") return "";
  return parsed.jobNumber + "/" + parsed.name;
}

/**
 * 组装 MasterData 的 19 列行数据（14 个业务字段 + 策略ID/版本号/生效时间/最后修改人/最后修改时间）
 * @param {Object} fields 14 个业务字段
 * @param {string} strategyId
 * @param {string} version
 * @param {string} effectiveTime
 * @param {string} modifier
 * @param {string} modifiedTime
 * @returns {Array<*>}
 */
function buildStrategyMasterRow_(fields, strategyId, version, effectiveTime, modifier, modifiedTime) {
  var snapshot = strategyBusinessSnapshot_(fields);
  var row = STRATEGY_BUSINESS_FIELDS.map(function (field) {
    return snapshot[field];
  });
  row.push(strategyId, version, effectiveTime, modifier, modifiedTime);
  return row;
}

/**
 * 按策略ID查找 MasterData 行（含 1-based 行号）
 * @param {string} strategyId
 * @returns {{rowNumber:number,row:Object}|null}
 */
function findStrategyMasterRow_(strategyId) {
  var target = strategyId === null || strategyId === undefined ? "" : String(strategyId).trim();
  if (target === "") return null;
  var ws = SpreadsheetApp.openById(STRATEGY_SS_ID).getSheetByName(STRATEGY_MASTER_SHEET_NAME);
  var lastRow = ws.getLastRow();
  if (lastRow < 2) return null;
  var data = ws.getSheetValues(2, 1, lastRow - 1, STRATEGY_MASTER_HEADERS.length);
  for (var i = 0; i < data.length; i++) {
    var current = data[i][14];
    var text = current === null || current === undefined ? "" : String(current).trim();
    if (text === target) {
      return { rowNumber: i + 2, row: strategyRowToObject_(STRATEGY_MASTER_HEADERS, data[i]) };
    }
  }
  return null;
}

/**
 * 查找同一策略在当前行之前最近一条生效记录的行号
 * @param {number} currentRowNumber 当前 History 行号（1-based）
 * @param {string} strategyId
 * @returns {number} 未找到返回 0
 */
function findStrategyPreviousEffectiveRow_(currentRowNumber, strategyId) {
  var target = strategyId === null || strategyId === undefined ? "" : String(strategyId).trim();
  if (target === "") return 0;
  var ws = SpreadsheetApp.openById(STRATEGY_SS_ID).getSheetByName(STRATEGY_HISTORY_SHEET_NAME);
  var lastRow = Math.min(ws.getLastRow(), currentRowNumber - 1);
  if (lastRow < 2) return 0;
  var data = ws.getSheetValues(2, 1, lastRow - 1, STRATEGY_HISTORY_HEADERS.length);
  var found = 0;
  for (var i = 0; i < data.length; i++) {
    var status = data[i][9] === null || data[i][9] === undefined ? "" : String(data[i][9]).trim();
    if (status !== STRATEGY_STATUS.effective) continue;
    var content = null;
    try {
      content = JSON.parse(data[i][1]);
    } catch (e) {
      content = null;
    }
    var rowStrategyId = content && content.strategyId !== null && content.strategyId !== undefined
      ? String(content.strategyId).trim()
      : "";
    if (rowStrategyId === target) found = i + 2;
  }
  return found;
}

/**
 * 读取 History 中所有非空的策略ID（含已作废策略，避免新策略复用旧号）
 * @returns {Array<string>}
 */
function readStrategyHistoryStrategyIds_() {
  return readStrategyHistoryRows_().map(function (historyRowItem) {
    var content = null;
    try {
      content = JSON.parse(historyRowItem["Strategy Content"]);
    } catch (e) {
      content = null;
    }
    return content && content.strategyId !== null && content.strategyId !== undefined
      ? String(content.strategyId).trim()
      : "";
  }).filter(function (id) {
    return id !== "";
  });
}

/**
 * 生成发放人列文字：`发放/ Release {email} {timestamp}`
 * @param {string} email 文控邮箱
 * @returns {string}
 */
function strategyReleaseWord_(email) {
  var person = email === null || email === undefined ? "" : String(email).trim();
  var timestamp = Utilities.formatDate(new Date(), "Asia/Shanghai", "yyyy-MM-dd HH:mm:ss");
  return "发放/ Release " + person + " " + timestamp;
}

/**
 * 生成退回人列文字：`退回/ Return {email} {timestamp} - {reason}`
 * @param {string} email 文控邮箱
 * @param {string} reason 退回原因
 * @returns {string}
 */
function strategyReturnWord_(email, reason) {
  var person = email === null || email === undefined ? "" : String(email).trim();
  var text = reason === null || reason === undefined ? "" : String(reason).trim();
  var timestamp = Utilities.formatDate(new Date(), "Asia/Shanghai", "yyyy-MM-dd HH:mm:ss");
  return "退回/ Return " + person + " " + timestamp + " - " + text;
}

/**
 * 发送发放/退回结果邮件（收件人为申请人，可抄送两位经理）
 * @param {{subject:string,introHtml:string,to:string,cc:Array<string>,row:Object,fields:Object,action:string,extraHeader:string,extraValue:string}} mail
 */
function sendStrategyReleaseResultMail_(mail) {
  var recipient = mail.to === null || mail.to === undefined ? "" : String(mail.to).trim();
  if (recipient === "") return;
  var row = mail.row || {};
  var fields = mail.fields || {};
  var actionLabel = mail.action === "new" ? "新建/ New" : mail.action === "edit" ? "修改/ Modify" : mail.action === "void" ? "作废/ Void" : "";
  var ccList = (mail.cc || []).map(function (item) {
    return item === null || item === undefined ? "" : String(item).trim();
  }).filter(function (item) {
    return item !== "";
  }).join(",");
  var bodyHtml = mail.introHtml || "";
  bodyHtml += _buildMoCInfoTable(
    ["工序/ Process", "机型/ Machine Type", "策略描述/ PM Description", "申请类型/ Request Type", "变更原因/ Reason", "申请人/ Applicant", mail.extraHeader],
    [[
      row.Process || "",
      row.MachineType || "",
      fields["PM Description"] || "",
      actionLabel,
      row.Reason || "",
      row.submitMail || "",
      mail.extraValue || ""
    ]]
  );
  bodyHtml += "<p style='font-size:13px;margin-top:16px'>您可以点击下面的链接来登录系统：<br><a href='https://script.google.com/a/macros/colpal.com/s/AKfycbxpDYL02i5FaFzUDcIoW3siG2U94cvWUUnz_F5x2BO1jnrXoMGzFQH-jw9C4nvZ7FE/exec'>任务清单变更管理/ Tasklist MoC</a></p>";
  var options = { htmlBody: _buildMoCEmailShell(mail.subject, bodyHtml) };
  if (ccList !== "") options.cc = ccList;
  GmailApp.sendEmail(recipient, mail.subject, "", options);
}

/**
 * 文控发放保养策略申请（新增 / 修改 / 作废）
 * @param {{jobNumber:string,name:string,operator:string}} payload
 * @returns {{ok:boolean,message?:string,strategyId?:string,version?:string}}
 */
function releaseStrategy(payload) {
  var data = payload || {};
  var user = getStrategyUserByJobNumber_(data.jobNumber);
  if (!user) {
    return { ok: false, message: "用户不存在或未登录 / User not found" };
  }
  if (!strategyHasPermission_(user, "发放")) {
    return { ok: false, message: "没有发放权限 / No release permission" };
  }

  var found = findStrategyHistoryRow_(data.operator);
  if (!found) {
    return { ok: false, message: "发放记录不存在 / Release record not found" };
  }
  var row = found.row;
  var status = row.Status === null || row.Status === undefined ? "" : String(row.Status).trim();
  if (status !== STRATEGY_STATUS.waitRelease) {
    return { ok: false, message: "该申请不在待发放状态 / Request is not waiting for release" };
  }

  var content = null;
  try {
    content = JSON.parse(row["Strategy Content"]);
  } catch (e) {
    content = null;
  }
  var action = strategyAction_(content);
  if (action === "") {
    return { ok: false, message: "策略内容无效 / Invalid strategy content" };
  }
  var strategyId = content.strategyId === null || content.strategyId === undefined
    ? ""
    : String(content.strategyId).trim();

  var masterRow = action === "new" ? null : findStrategyMasterRow_(strategyId);
  if (action !== "new") {
    if (!masterRow) {
      return { ok: false, message: "策略不存在，无法发放 / Strategy not found, cannot release" };
    }
    var baseVersion = normalizeStrategyVersion_(content.old ? content.old.version : "");
    var masterVersion = normalizeStrategyVersion_(masterRow.row["版本号"]);
    if (baseVersion !== masterVersion) {
      return { ok: false, message: "策略已更新，请刷新后重试 / Strategy has been updated, please refresh" };
    }
  }

  var now = Utilities.formatDate(new Date(), "Asia/Shanghai", "yyyy-MM-dd HH:mm:ss");
  var modifier = strategyApplicantLabel_(row.Operator);
  var ss = SpreadsheetApp.openById(STRATEGY_SS_ID);
  var masterWs = ss.getSheetByName(STRATEGY_MASTER_SHEET_NAME);
  var historyWs = ss.getSheetByName(STRATEGY_HISTORY_SHEET_NAME);
  var version;
  var releaseStatus;

  if (action === "new") {
    var existingIds = readStrategyMasterRows_().map(function (masterRowItem) {
      return masterRowItem["策略ID"];
    }).concat(readStrategyHistoryStrategyIds_());
    strategyId = nextStrategyId_(existingIds);
    version = "00";
    releaseStatus = STRATEGY_STATUS.effective;
    masterWs.appendRow(buildStrategyMasterRow_(content.new, strategyId, version, now, modifier, now));
    content.strategyId = strategyId;
    historyWs.getRange(found.rowNumber, 2).setValue(JSON.stringify(content));
  } else if (action === "edit") {
    version = normalizeStrategyVersion_(content.version);
    releaseStatus = STRATEGY_STATUS.effective;
    masterWs.getRange(masterRow.rowNumber, 1, 1, STRATEGY_MASTER_HEADERS.length)
      .setValues([buildStrategyMasterRow_(content.new, strategyId, version, now, modifier, now)]);
  } else {
    version = normalizeStrategyVersion_(content.old.version);
    releaseStatus = STRATEGY_STATUS.void;
    masterWs.deleteRow(masterRow.rowNumber);
  }

  var releaseEmail = user.email === null || user.email === undefined ? "" : String(user.email).trim();
  if (releaseEmail === "") {
    releaseEmail = Session.getActiveUser().getEmail();
  }
  historyWs.getRange(found.rowNumber, 9).setValue(strategyReleaseWord_(releaseEmail));
  historyWs.getRange(found.rowNumber, 10).setValue(releaseStatus);

  if (action === "edit" || action === "void") {
    var previousRowNumber = findStrategyPreviousEffectiveRow_(found.rowNumber, strategyId);
    if (previousRowNumber > 0) {
      historyWs.getRange(previousRowNumber, 10).setValue(
        action === "edit" ? STRATEGY_STATUS.replaced : STRATEGY_STATUS.void
      );
    }
  }

  var approvers = getStrategyApprovers_(row.Process);
  var fields = content.new || content.old || {};
  var applicantEmail = row.submitMail === null || row.submitMail === undefined ? "" : String(row.submitMail).trim();
  var isVoid = action === "void";
  sendStrategyReleaseResultMail_({
    subject: isVoid
      ? "保养策略作废 -- 已发放/ PM Strategy Void -- Released"
      : "保养策略发放 -- 生效/ PM Strategy Release -- Effective",
    introHtml: isVoid
      ? "<p style='font-size:15px;margin:0 0 12px'>您的保养策略作废申请已由文控发放，策略已作废 / Your PM strategy void request has been released and the strategy is now void.</p>"
      : "<p style='font-size:15px;margin:0 0 12px'>您的保养策略申请已由文控发放并生效 / Your PM strategy application has been released and is now effective.</p>",
    to: applicantEmail,
    cc: [
      approvers.processManager ? approvers.processManager.email : "",
      approvers.deptManager ? approvers.deptManager.email : ""
    ],
    row: row,
    fields: fields,
    action: action,
    extraHeader: "生效时间/ Effective Time",
    extraValue: now
  });

  return { ok: true, strategyId: strategyId, version: version };
}

/**
 * 文控退回保养策略申请（不写 MasterData，状态置拒绝解锁）
 * @param {{jobNumber:string,name:string,operator:string,reason:string}} payload
 * @returns {{ok:boolean,message?:string}}
 */
function returnStrategy(payload) {
  var data = payload || {};
  var user = getStrategyUserByJobNumber_(data.jobNumber);
  if (!user) {
    return { ok: false, message: "用户不存在或未登录 / User not found" };
  }
  if (!strategyHasPermission_(user, "发放")) {
    return { ok: false, message: "没有发放权限 / No release permission" };
  }

  var found = findStrategyHistoryRow_(data.operator);
  if (!found) {
    return { ok: false, message: "退回记录不存在 / Release record not found" };
  }
  var row = found.row;
  var status = row.Status === null || row.Status === undefined ? "" : String(row.Status).trim();
  if (status !== STRATEGY_STATUS.waitRelease) {
    return { ok: false, message: "该申请不在待发放状态 / Request is not waiting for release" };
  }

  var reason = data.reason === null || data.reason === undefined ? "" : String(data.reason).trim();
  if (reason === "") {
    return { ok: false, message: "退回原因必填 / Reason is required" };
  }

  var content = null;
  try {
    content = JSON.parse(row["Strategy Content"]);
  } catch (e) {
    content = null;
  }
  var action = strategyAction_(content);
  var fields = content && (content.new || content.old) ? (content.new || content.old) : {};

  var returnEmail = user.email === null || user.email === undefined ? "" : String(user.email).trim();
  if (returnEmail === "") {
    returnEmail = Session.getActiveUser().getEmail();
  }
  var ws = SpreadsheetApp.openById(STRATEGY_SS_ID).getSheetByName(STRATEGY_HISTORY_SHEET_NAME);
  ws.getRange(found.rowNumber, 9).setValue(strategyReturnWord_(returnEmail, reason));
  ws.getRange(found.rowNumber, 10).setValue(STRATEGY_STATUS.rejected);

  var approvers = getStrategyApprovers_(row.Process);
  var applicantEmail = row.submitMail === null || row.submitMail === undefined ? "" : String(row.submitMail).trim();
  sendStrategyReleaseResultMail_({
    subject: "保养策略退回/ PM Strategy Returned",
    introHtml: "<p style='font-size:15px;margin:0 0 12px'>您的保养策略申请已被文控退回，请修改后重新提交 / Your PM strategy application has been returned by document control. Please revise and resubmit.</p>",
    to: applicantEmail,
    cc: [
      approvers.processManager ? approvers.processManager.email : "",
      approvers.deptManager ? approvers.deptManager.email : ""
    ],
    row: row,
    fields: fields,
    action: action,
    extraHeader: "退回原因/ Return Reason",
    extraValue: reason
  });

  return { ok: true };
}

/**
 * 读取当前生效的主数据（含表头）
 * @returns {{headers:Array<string>,rows:Array<Object>}}
 */
function getStrategyMasterData() {
  return {
    headers: STRATEGY_MASTER_HEADERS.slice(),
    rows: readStrategyMasterRows_()
  };
}

/**
 * 读取审批历史（含表头）
 * @returns {{headers:Array<string>,rows:Array<Object>}}
 */
function getStrategyHistoryData() {
  return {
    headers: STRATEGY_HISTORY_HEADERS.slice(),
    rows: readStrategyHistoryRows_()
  };
}

/**
 * 返回登录用户的策略上下文，找不到用户时返回 null
 * @param {string|number} jobNumber
 * @returns {{jobNumber:string,name:string,email:string,permissions:Array<string>,process:string}|null}
 */
function getStrategyUserContext(jobNumber) {
  var user = getStrategyUserByJobNumber_(jobNumber);
  if (!user) return null;
  var authorization = user.authorization === null || user.authorization === undefined
    ? ""
    : String(user.authorization);
  var permissions = authorization.split(",").map(function (item) {
    return item.trim();
  }).filter(function (item) {
    return item !== "";
  });
  return {
    jobNumber: user.jobNumber === null || user.jobNumber === undefined ? "" : String(user.jobNumber).trim(),
    name: user.name === null || user.name === undefined ? "" : user.name,
    email: user.email === null || user.email === undefined ? "" : user.email,
    permissions: permissions,
    process: user.process === null || user.process === undefined ? "" : user.process
  };
}

/**
 * 按队列级别过滤 History 行
 * process：待审批/作废待审批 + Approver1 空 + 工序命中本人 AX 范围
 * dept：待审批/作废待审批 + Approver1 已填 + Approver2 空
 * release：待发放
 * @param {string} level `process` | `dept` | `release`
 * @param {Object|null} user getStrategyUserContext 的返回值
 * @param {Array<Object>} historyRows
 * @returns {Array<Object>}
 */
function strategyQueueRows_(level, user, historyRows) {
  var result = [];
  (historyRows || []).forEach(function (row) {
    var status = row.Status === null || row.Status === undefined ? "" : String(row.Status).trim();
    var approver1 = row.Approver1 === null || row.Approver1 === undefined ? "" : String(row.Approver1).trim();
    var approver2 = row.Approver2 === null || row.Approver2 === undefined ? "" : String(row.Approver2).trim();
    if (level === "process") {
      if (status !== STRATEGY_STATUS.pending && status !== STRATEGY_STATUS.voidPending) return;
      if (approver1 !== "") return;
      if (!strategyProcessMatches_(user, row.Process)) return;
    } else if (level === "dept") {
      if (status !== STRATEGY_STATUS.pending && status !== STRATEGY_STATUS.voidPending) return;
      if (approver1 === "" || approver2 !== "") return;
    } else if (level === "release") {
      if (status !== STRATEGY_STATUS.waitRelease) return;
    } else {
      return;
    }
    result.push(row);
  });
  return result;
}

/**
 * 判断用户是否具备指定队列的角色权限
 * process：策略工序经理且 AX 工序范围非空；dept：策略部门经理；release：发放
 * @param {string} level `process` | `dept` | `release`
 * @param {Object|null} user getStrategyUserContext 的返回值
 * @returns {boolean}
 */
function strategyQueueLevelAllowed_(level, user) {
  if (!user) return false;
  if (level === "process") {
    var scope = user.process === null || user.process === undefined ? "" : String(user.process).trim();
    return scope !== "" && strategyHasPermission_(user, "策略工序经理");
  }
  if (level === "dept") return strategyHasPermission_(user, "策略部门经理");
  if (level === "release") return strategyHasPermission_(user, "发放");
  return false;
}

/**
 * 读取指定角色的待办队列；用户不具备对应角色权限（或 level 无效）时 rows 为空
 * @param {string} level `process` | `dept` | `release`
 * @param {string|number} jobNumber
 * @returns {{rows:Array<Object>,user:Object|null,master:Array<Object>}}
 */
function getStrategyWorkQueue(level, jobNumber) {
  var user = getStrategyUserContext(jobNumber);
  if (!user) return { rows: [], user: null, master: [] };
  var queueLevel = level === null || level === undefined ? "" : String(level).trim();
  if (!strategyQueueLevelAllowed_(queueLevel, user)) {
    return { rows: [], user: user, master: [] };
  }
  return {
    rows: strategyQueueRows_(queueLevel, user, readStrategyHistoryRows_()),
    user: user,
    master: readStrategyMasterRows_()
  };
}

/**
 * 统计当前用户的策略待办数
 * 按角色过滤：工序经理统计本人工序范围的待审单，部门经理统计部门节点，文控统计待发放；
 * 用户没有对应角色权限时该项恒为 0
 * @param {string|number} jobNumber
 * @returns {{process:number,dept:number,release:number,total:number}}
 */
function getStrategyPendingCounts(jobNumber) {
  var counts = { process: 0, dept: 0, release: 0, total: 0 };
  var user = getStrategyUserContext(jobNumber);
  if (!user) return counts;
  var historyRows = readStrategyHistoryRows_();
  if (strategyQueueLevelAllowed_("process", user)) {
    counts.process = strategyQueueRows_("process", user, historyRows).length;
  }
  if (strategyQueueLevelAllowed_("dept", user)) {
    counts.dept = strategyQueueRows_("dept", user, historyRows).length;
  }
  if (strategyQueueLevelAllowed_("release", user)) {
    counts.release = strategyQueueRows_("release", user, historyRows).length;
  }
  counts.total = counts.process + counts.dept + counts.release;
  return counts;
}

/**
 * 判断 14 个业务字段是否全为空
 * @param {Object} fields
 * @returns {boolean}
 */
function strategyFieldsAllBlank_(fields) {
  for (var i = 0; i < STRATEGY_BUSINESS_FIELDS.length; i++) {
    var value = fields ? fields[STRATEGY_BUSINESS_FIELDS[i]] : "";
    if (value !== null && value !== undefined && String(value).trim() !== "") return false;
  }
  return true;
}

/**
 * 获取策略 MasterData 工作表：不存在时创建，空表时写入表头
 * @returns {{ok:boolean,sheet?:object,message?:string}}
 */
function getStrategyMasterSheet_() {
  var ss = SpreadsheetApp.openById(STRATEGY_SS_ID);
  var ws = ss.getSheetByName(STRATEGY_MASTER_SHEET_NAME);
  if (!ws) {
    ws = ss.insertSheet(STRATEGY_MASTER_SHEET_NAME);
  }
  var lastRow = ws.getLastRow();
  if (lastRow === 0) {
    ws.getRange(1, 1, 1, STRATEGY_MASTER_HEADERS.length).setValues([STRATEGY_MASTER_HEADERS.slice()]);
    return { ok: true, sheet: ws };
  }
  if (lastRow === 1) {
    var header = ws.getRange(1, 1, 1, STRATEGY_MASTER_HEADERS.length).getValues()[0] || [];
    var normalized = header.map(function (value) {
      return value === null || value === undefined ? "" : String(value).trim();
    });
    if (normalized.indexOf("工序") === -1 || normalized.indexOf("Machine Type") === -1) {
      return { ok: false, message: "MasterData 表头不正确，请清空后重试" };
    }
  }
  return { ok: true, sheet: ws };
}

/**
 * 从 EQU 保养主数据表初始导入策略（仅当 MasterData 为空时允许）
 * @returns {{ok:boolean,count?:number,message?:string}}
 */
function importPMStrategyMasterData() {
  var masterResult = getStrategyMasterSheet_();
  if (!masterResult.ok) {
    return { ok: false, message: masterResult.message };
  }
  var masterWs = masterResult.sheet;
  if (masterWs.getLastRow() > 1) {
    return { ok: false, message: "主数据表已有数据，禁止重复导入 / MasterData is not empty" };
  }
  var historyRows = readStrategyHistoryRows_();
  for (var i = 0; i < historyRows.length; i++) {
    var operator = historyRows[i].Operator === null || historyRows[i].Operator === undefined
      ? ""
      : String(historyRows[i].Operator).trim();
    if (operator === STRATEGY_IMPORT_OPERATOR) {
      return { ok: false, message: "已存在初始导入记录，禁止重复导入 / Import baseline already exists" };
    }
  }

  var equWs = SpreadsheetApp.openById(STRATEGY_EQU_MASTER_SS_ID).getSheetByName(STRATEGY_EQU_MASTER_SHEET_NAME);
  var lastRow = equWs.getLastRow();
  if (lastRow < 2) return { ok: true, count: 0 };
  var data = equWs.getSheetValues(2, 1, lastRow - 1, STRATEGY_EQU_IMPORT_COLUMNS);

  var now = Utilities.formatDate(new Date(), "Asia/Shanghai", "yyyy-MM-dd HH:mm:ss");
  var historyWs = SpreadsheetApp.openById(STRATEGY_SS_ID).getSheetByName(STRATEGY_HISTORY_SHEET_NAME);
  var count = 0;
  for (var r = 0; r < data.length; r++) {
    var row = data[r] || [];
    var fields = strategyRowToObject_(STRATEGY_BUSINESS_FIELDS, row.slice(0, STRATEGY_BUSINESS_FIELDS.length));
    if (strategyFieldsAllBlank_(fields)) continue;
    var strategyId = row[15] === null || row[15] === undefined ? "" : String(row[15]).trim();
    var modifier = row[18] === null || row[18] === undefined ? "" : String(row[18]).trim();
    var modifiedTime = row[19] === null || row[19] === undefined ? "" : String(row[19]).trim();
    masterWs.appendRow(buildStrategyMasterRow_(fields, strategyId, "00", now, modifier, modifiedTime));
    var content = {
      strategyId: strategyId,
      version: "00",
      new: strategyBusinessSnapshot_(fields)
    };
    historyWs.appendRow([
      String(fields["Machine Type"]).trim(),
      JSON.stringify(content),
      STRATEGY_IMPORT_OPERATOR,
      STRATEGY_IMPORT_REASON,
      "",
      "",
      "",
      "",
      "",
      STRATEGY_STATUS.effective,
      "",
      String(fields["工序"]).trim()
    ]);
    count++;
  }
  return { ok: true, count: count };
}
