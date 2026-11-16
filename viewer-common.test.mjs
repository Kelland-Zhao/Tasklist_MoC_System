import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { extractScript } from './strategy-test-utils.mjs';

const src = extractScript(fs.readFileSync('Viewer_Common_JS.html', 'utf8'));
const api = new Function(
  `${src}; return { viewerEscape_, viewerParseOperator_, viewerParseApprover_, viewerBuildSteps_, viewerCurrentStepIdx_, viewerFlowHtml_, viewerStatusBadge_, viewerStatusBorderColor_, viewerExtractMainReason_, viewerReasonHtml_, viewerReasonDetailHtml_, viewerApplicantHtml_, viewerActionButtonsHtml_ };`
)();

test('解析申请人工号、姓名、时间', () => {
  const o = api.viewerParseOperator_('工号/ JobNumber: 33677_姓名/ Name: 林飞 2024-12-02 12:55:15');
  assert.equal(o.jobNumber, '33677');
  assert.equal(o.name, '林飞');
  assert.equal(o.timestamp, '2024-12-02 12:55:15');
});

test('解析审批人动作、姓名、日期', () => {
  const approved = api.viewerParseApprover_('批准/ Approve frank_shen@colpal.com 2024-12-02 13:47:43');
  assert.equal(approved.action, '批准');
  assert.equal(approved.name, 'frank_shen');
  assert.equal(approved.date, '2024-12-02');

  const rejected = api.viewerParseApprover_('拒绝/ Reject frank_shen@colpal.com 2024-12-02 13:47:43');
  assert.equal(rejected.action, '拒绝');
  assert.equal(api.viewerParseApprover_(''), null);
});

test('审批步骤按配置跳过班组并推进到文控发放', () => {
  const steps = api.viewerBuildSteps_({
    'Production Approval (Y/N)': 'N',
    'Production Approver': '',
    Approver1: '批准/ Approve a@colpal.com 2024-12-02',
    Approver2: '批准/ Approve b@colpal.com 2024-12-03',
    Dissminater: '发放/ Dissminater c@colpal.com 2024-12-04',
  });
  assert.equal(steps[0].skip, true);
  assert.equal(api.viewerCurrentStepIdx_(steps), -1);
});

test('流程 HTML：全部完成显示已生效，并进行 HTML 转义', () => {
  const html = api.viewerFlowHtml_({
    'Production Approval (Y/N)': 'N',
    Approver1: '批准/ Approve a@colpal.com 2024-12-02',
    Approver2: '批准/ Approve b@colpal.com 2024-12-03',
    Dissminater: '发放/ Dissminater <img src=x> 2024-12-04',
  });
  assert.ok(html.includes('flow-dot done'));
  assert.ok(html.includes('flow-dot na'));
  assert.ok(html.includes('文控发放'));
  assert.ok(html.includes('已生效'));
  assert.ok(!html.includes('<img src=x>'));
});

test('状态徽章与左边框颜色', () => {
  assert.ok(api.viewerStatusBadge_('生效/ Effective').includes('st-effective'));
  assert.ok(api.viewerStatusBadge_('取代/ Replace').includes('st-replace'));
  assert.ok(api.viewerStatusBadge_('作废/ Void').includes('st-void'));
  assert.equal(api.viewerStatusBorderColor_('生效/ Effective'), '#198754');
  assert.equal(api.viewerStatusBorderColor_('拒绝/ Rejected'), '#dc3545');
});

test('变更原因摘要与详情解析并转义', () => {
  const reason = '变更原因/ Reason for change: 更换油管 <img src=x> 修改条目数/ Number of edit: 2 新增条目数/ Number of add: 1 删除条目数/ Number of delete: 0';
  assert.equal(api.viewerExtractMainReason_(reason), '更换油管 <img src=x>');

  const col = api.viewerReasonHtml_(reason);
  assert.ok(col.includes('更换油管 &lt;img src=x&gt;'));
  assert.ok(col.includes('btn-reason-detail'));

  const detail = api.viewerReasonDetailHtml_(reason);
  assert.ok(detail.includes('新增条目数'));
  assert.ok(detail.includes('修改条目数'));
  assert.ok(detail.includes('&lt;img src=x&gt;'));
  assert.ok(!detail.includes('<img src=x>'));
});

test('申请人两行显示且转义', () => {
  const html = api.viewerApplicantHtml_('工号/ JobNumber: 33677_姓名/ Name: <b>林飞</b> 2024-12-02 12:55:15');
  assert.ok(html.includes('33677'));
  assert.ok(html.includes('&lt;b&gt;林飞&lt;/b&gt;'));
  assert.ok(!html.includes('<b>林飞</b>'));
});

test('操作列包含任务清单和版本历史', () => {
  const html = api.viewerActionButtonsHtml_();
  assert.ok(html.includes('btn-tasklist-detail'));
  assert.ok(html.includes('btn-version-history'));
  assert.ok(html.includes('任务清单'));
  assert.ok(html.includes('版本历史'));
});

test('两个查阅页接入公共渲染与精简列', () => {
  const pages = [
    ['Tasklist_Viewer.html', 'Tasklist_Viewer_JS.html'],
    ['Inspection_Viewer.html', 'Inspection_Viewer_JS.html'],
  ];
  pages.forEach(([htmlFile, jsFile]) => {
    const html = fs.readFileSync(htmlFile, 'utf8');
    const js = fs.readFileSync(jsFile, 'utf8');
    assert.ok(html.includes('include("Viewer_Common_JS")'), htmlFile);
    assert.ok(html.includes('审批流程<br><small>Approval Flow</small>'), htmlFile);
    assert.ok(!html.includes('审批人1<br><small>Approval Level 1</small>'), htmlFile);
    assert.ok(js.includes('viewerFlowHtml_'), jsFile);
    assert.ok(js.includes('viewerStatusBadge_'), jsFile);
    assert.ok(js.includes('viewerReasonDetailHtml_'), jsFile);
    assert.ok(js.includes('scrollX: true'), jsFile);
  });
});
