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

    let machineType = JSON.parse(obj)[0].MachineType;

    console.log("machineType", machineType);

    let row = data.filter((r) => {
      return r[0].toString().trim() == machineType.trim();
    });

    if (row.length === 0) {
      console.error("Database for Web 中未找到机型: " + machineType);
      return false;
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
      return false;
    }

    let recipient;

    if (production_Approval == true) {
      production_Approval_words = "Y";

      recipient = row[0][6]; //Mail_Production
    } else {
      production_Approval_words = "N";

      recipient = row[0][2]; //Mail_Approve1
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

  if (objBasicInfo.Mail_production_Approval == "Y") {
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

  if (objBasicInfo.Mail_production_Approval == "Y") {
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
