import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function extractFunction(src, name) {
  const start = src.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`${name} not found`);
  let depth = 0;
  for (let i = src.indexOf('{', start); i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error(`${name} braces not balanced`);
}

let src = '';
try { src = fs.readFileSync('Measurement_Config_JS.html', 'utf8'); } catch (e) { src = ''; }
for (const name of ['measurementConfigText_', 'measurementConfigPdMYes_', 'parseMeasurementPoints_', 'parsePointLabels_', 'validateMeasurementConfig_', 'buildPdMSummary_', 'measurementConfigEscape_', 'buildPdMConfigField_', 'buildPdMConfigSelect_', 'buildPdMConfigSection_', 'buildPointLabelInputsHtml_', 'composePointLabels_', 'buildPdMConfigModalHtml_']) {
  const fn = (() => { try { return extractFunction(src, name); } catch (e) { return null; } })();
  (0, eval)(fn || `function ${name}(){ throw new Error("${name} not found in Measurement_Config_JS.html"); }`);
}

test('解析测点：去空、去重、保留顺序', () => {
  assert.deepEqual(parseMeasurementPoints_(' S1, S2,,S1,S4 '), [{ code: 'S1' }, { code: 'S2' }, { code: 'S4' }]);
});

test('解析测点位置：分号分隔 code=label', () => {
  assert.deepEqual(parsePointLabels_('S1=操作侧;S2=非操作侧;S3=天侧;S4=地侧'), {
    S1: '操作侧', S2: '非操作侧', S3: '天侧', S4: '地侧',
  });
});

test('测点与位置不匹配时报配置错误', () => {
  const errors = validateMeasurementConfig_({
    'PdM?': '是/ Yes',
    'Measurement Points': 'S1,S2,S3,S4',
    'Point Labels': 'S1=操作侧;S2=非操作侧;S3=天侧',
    'Measurement Unit': 'kN',
  });
  assert.ok(errors.some((e) => e.field === 'Point Labels'));
});

test('完整配置通过并生成摘要', () => {
  const task = {
    'PdM?': '是/ Yes',
    'Measurement Points': 'S1,S2,S3,S4',
    'Point Labels': 'S1=操作侧;S2=非操作侧;S3=天侧;S4=地侧',
    'Measurement Unit': 'kN',
  };
  assert.deepEqual(validateMeasurementConfig_(task), []);
  assert.equal(buildPdMSummary_(task), 'S1-S4 · kN');
});

test('预测性=否 时不校验并返回占位摘要', () => {
  assert.deepEqual(validateMeasurementConfig_({ 'PdM?': '否/ No' }), []);
  assert.equal(buildPdMSummary_({ 'PdM?': '否/ No' }), '—');
});

test('缺少单位时报错', () => {
  const errors = validateMeasurementConfig_({
    'PdM?': '是/ Yes',
    'Measurement Points': 'S1',
    'Point Labels': 'S1=操作侧',
  });
  assert.ok(errors.some((e) => e.field === 'Measurement Unit'));
});

test('编辑页包含照片列与 PdM 配置按钮', () => {
  const html = fs.readFileSync('Tasklist_MoC_Modify.html', 'utf8');
  const js = fs.readFileSync('Tasklist_MoC_Modify_JS.html', 'utf8');
  assert.ok(js.includes('Photo Required'));
  assert.ok(js.includes('btn-pdm-config'));
  assert.ok(js.includes('openPdMConfigModal_'));
  assert.ok(html.includes('需要照片'));
  assert.ok(html.includes('PdM 配置'));
});

test('新建页包含照片列与 PdM 配置按钮', () => {
  const html = fs.readFileSync('Tasklist_Create.html', 'utf8');
  const js = fs.readFileSync('Tasklist_Create_JS.html', 'utf8');
  assert.ok(js.includes('Photo Required'));
  assert.ok(js.includes('btn-pdm-config'));
  assert.ok(js.includes('openPdMConfigModal_'));
  assert.ok(html.includes('需要照片'));
  assert.ok(html.includes('PdM 配置'));
});

test('编辑页 PM_FIELDS 与新建页空值排除包含测量配置', () => {
  const modify = fs.readFileSync('Tasklist_MoC_Modify_JS.html', 'utf8');
  const pmFields = modify.match(/const PM_FIELDS = \[([\s\S]*?)\];/);
  assert.ok(pmFields, '未找到 PM_FIELDS');
  ['Measurement Points', 'Point Labels', 'Measurement Unit', 'Photo Required'].forEach((f) => {
    assert.ok(pmFields[1].includes(f), 'PM_FIELDS 缺少 ' + f);
  });
  const create = fs.readFileSync('Tasklist_Create_JS.html', 'utf8');
  ['Measurement Points', 'Point Labels', 'Measurement Unit', 'Photo Required'].forEach((f) => {
    assert.ok(create.includes('key === "' + f + '"'), '新建页空值排除缺少 ' + f);
  });
});

test('PdM 配置弹窗的 Logic 为下拉框', () => {
  const html = buildPdMConfigModalHtml_({
    'Unit': '哥林柱',
    'Logic': 'HighAlarm_Max',
    'Measurement Unit': 'kN',
  });
  assert.ok(html.includes('<select id="pdmLogic"'));
  assert.ok(html.includes('请选择/ Please select'));
  assert.ok(html.includes('HighAlarm_Max'));
  assert.ok(html.includes('LowAlarm_Slope'));
  assert.ok(html.includes('Out_of_range'));
  assert.ok(html.includes('selected'));
  assert.ok(html.includes('id="pdmUnit"'));
  assert.ok(!html.includes('<select id="pdmUnit"'));
});

test('PdM 配置弹窗的 Measurement Unit 为下拉框且含常见单位', () => {
  const html = buildPdMConfigModalHtml_({ 'Measurement Unit': 'kN' });
  assert.ok(html.includes('<select id="pdmUnitPhysical"'));
  for (const unit of ['kN', '吨力', 'με', 'mm/s', 'μm', '°C', 'MPa', 'N·m', 'rpm', '%']) {
    assert.ok(html.includes(unit), unit);
  }
});

test('未知单位保留为选中项', () => {
  const html = buildPdMConfigModalHtml_({ 'Measurement Unit': '自定义单位' });
  assert.ok(html.includes('自定义单位'));
  assert.ok(/value="自定义单位" selected/.test(html));
});

test('弹窗按三组分区并两列排布', () => {
  const html = buildPdMConfigModalHtml_({});
  assert.ok(html.includes('测量对象'));
  assert.ok(html.includes('MEASUREMENT OBJECT'));
  assert.ok(html.includes('判定规则'));
  assert.ok(html.includes('LIMIT RULES'));
  assert.ok(html.includes('测量要求'));
  assert.ok(html.includes('MEASUREMENT REQUIREMENT'));
  assert.ok(html.includes('row g-3'));
  assert.ok(html.includes('col-md-4'));
  assert.ok(html.includes('col-md-6'));
});

test('必填字段有红色星号，LL/HH 为数字输入且可空', () => {
  const html = buildPdMConfigModalHtml_({});
  assert.ok(html.includes('测量单元<span style="color:#E60012'));
  assert.ok(html.includes('type="number"'));
  assert.ok(html.includes('可空'));
  assert.ok(html.includes('留空 = 待判定'));
  assert.ok(html.includes('placeholder="如 哥林柱拉伸变形量"'));
});

test('测点位置按测点生成输入框', () => {
  const html = buildPdMConfigModalHtml_({
    'Measurement Points': 'S1,S2',
    'Point Labels': 'S1=操作侧;S2=非操作侧',
  });
  assert.ok(html.includes('id="pdmLabelsContainer"'));
  assert.ok(html.includes('class="form-control form-control-sm pdm-point-label"'));
  assert.ok(html.includes('data-point="S1"'));
  assert.ok(html.includes('value="操作侧"'));
  assert.ok(html.includes('data-point="S2"'));
  assert.ok(html.includes('value="非操作侧"'));
});

test('测点为空时显示提示', () => {
  const html = buildPdMConfigModalHtml_({});
  assert.ok(html.includes('先填写测点'));
});

test('拼接回 Point Labels 字符串', () => {
  assert.equal(composePointLabels_('S1,S2', { S1: '操作侧', S2: '非操作侧' }), 'S1=操作侧;S2=非操作侧');
  assert.equal(composePointLabels_('S1,S2', { S1: '操作侧', S2: '' }), 'S1=操作侧;S2=');
  assert.equal(composePointLabels_('', {}), '');
});
