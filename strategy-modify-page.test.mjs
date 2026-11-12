import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { extractScript, makeJQueryStub } from './strategy-test-utils.mjs';

const commonSrc = extractScript(fs.readFileSync(new URL('./Strategy_Common_JS.html', import.meta.url), 'utf8'));
const src = extractScript(fs.readFileSync(new URL('./Strategy_Modify_JS.html', import.meta.url), 'utf8'));
const api = new Function(`${commonSrc}; ${src}; return { buildStrategyEditPayload, applyStrategyModifyConditionalState, collectStrategyEditFormValues, fillStrategyEditForm, strategyModifyFieldHtml_, strategyModifyAppendTasklistOptions_, initStrategyModifyTasklistSelect2_, loadStrategyModifyTasklistOptions, STRATEGY_FIELDS };`)();

function fullOld(overrides) {
  return {
    '工序': 'IM',
    'Machine Type': 'FCS',
    'PM Frequency': '季',
    '单次停机时间/ h': '8',
    'PM Description': '季度保养',
    'RBM保养间隔时间': '6',
    'RBM保养提醒间隔时间': '1',
    '强制保养频率/ Month': '3',
    '策略 / Strategy': 'RBM',
    'TasklistName': '[FCS]',
    '是否创工单': 'Y',
    '工单类型': 'PM10',
    '是否计入AEM': 'Y',
    '备注': '',
    '策略ID': 'PM-MD-0001',
    '版本号': '00',
    ...(overrides || {})
  };
}

function fullValues(overrides) {
  const values = fullOld(overrides);
  delete values['策略ID'];
  delete values['版本号'];
  return values;
}

const user = { jobNumber: '10001', name: '林飞' };

test('修改 payload 带 strategyId 与 old.version', () => {
  const p = api.buildStrategyEditPayload('PM-MD-0001', fullOld(), fullValues({ '备注': 'x' }), user, '调整频率');
  assert.equal(p.strategyId, 'PM-MD-0001');
  assert.equal(p.old.version, '00');
  assert.equal(p.reason, '调整频率');
  assert.equal(p.fields['备注'], 'x');
});

test('缺策略ID、变更原因或必填字段返回 null', () => {
  const old = fullOld();
  const values = fullValues();
  assert.equal(api.buildStrategyEditPayload('PM-MD-0001', old, values, user, ''), null);
  assert.equal(api.buildStrategyEditPayload('', old, values, user, '调整频率'), null);
  ['单次停机时间/ h', 'TasklistName', '是否创工单', '是否计入AEM'].forEach((key) => {
    assert.equal(
      api.buildStrategyEditPayload('PM-MD-0001', old, fullValues({ [key]: '' }), user, '调整频率'),
      null,
      key
    );
  });
});

test('RBM 缺条件必填字段返回 null', () => {
  const old = fullOld();
  ['RBM保养间隔时间', 'RBM保养提醒间隔时间', '强制保养频率/ Month'].forEach((key) => {
    assert.equal(
      api.buildStrategyEditPayload('PM-MD-0001', old, fullValues({ [key]: '' }), user, '调整频率'),
      null,
      key
    );
  });
});

test('是否创工单 = Y 时工单类型必填；N 时规范化为 NA', () => {
  const old = fullOld();
  assert.equal(
    api.buildStrategyEditPayload('PM-MD-0001', old, fullValues({ '工单类型': '' }), user, '调整频率'),
    null
  );
  const p = api.buildStrategyEditPayload(
    'PM-MD-0001', old, fullValues({ '是否创工单': 'N', '工单类型': '' }), user, '调整频率'
  );
  assert.notEqual(p, null);
  assert.equal(p.fields['工单类型'], 'NA');
});

test('非 RBM 规范化三个 RBM 字段为 NA 且不要求必填', () => {
  const values = fullValues({
    '策略 / Strategy': 'CBM',
    'RBM保养间隔时间': '',
    'RBM保养提醒间隔时间': '',
    '强制保养频率/ Month': ''
  });
  const p = api.buildStrategyEditPayload('PM-MD-0001', fullOld(), values, user, '调整频率');
  assert.notEqual(p, null);
  assert.equal(p.fields['RBM保养间隔时间'], 'NA');
  assert.equal(p.fields['RBM保养提醒间隔时间'], 'NA');
  assert.equal(p.fields['强制保养频率/ Month'], 'NA');
  assert.equal(values['RBM保养间隔时间'], '', 'builder 不应修改入参');
});

test('工序与 Machine Type 强制取自 old，篡改 values 无效', () => {
  const old = fullOld();
  const tampered = fullValues({ '工序': 'TF', 'Machine Type': 'HACK' });
  const p = api.buildStrategyEditPayload('PM-MD-0001', old, tampered, user, '调整频率');
  assert.equal(p.fields['工序'], 'IM');
  assert.equal(p.fields['Machine Type'], 'FCS');
});

test('载入主表行后按条件应用禁用/NA 状态', () => {
  const initial = {};
  api.STRATEGY_FIELDS.forEach((field) => {
    initial[`[data-strategy-field="${field.key}"]`] = '';
  });
  const jq = makeJQueryStub(initial);
  api.fillStrategyEditForm(jq, fullOld({
    '策略 / Strategy': 'TBM',
    '是否创工单': 'N',
    'RBM保养间隔时间': '',
    'RBM保养提醒间隔时间': '',
    '强制保养频率/ Month': '',
    '工单类型': ''
  }));
  ['RBM保养间隔时间', 'RBM保养提醒间隔时间', '强制保养频率/ Month', '工单类型'].forEach((key) => {
    assert.equal(jq(`[data-strategy-field="${key}"]`).prop('disabled'), true, key);
    assert.equal(jq(`[data-strategy-field="${key}"]`).val(), 'NA', key);
  });

  api.fillStrategyEditForm(jq, fullOld({
    '策略 / Strategy': 'RBM',
    '是否创工单': 'Y',
    'RBM保养间隔时间': '6',
    'RBM保养提醒间隔时间': '1',
    '强制保养频率/ Month': '3',
    '工单类型': 'PM10'
  }));
  ['RBM保养间隔时间', 'RBM保养提醒间隔时间', '强制保养频率/ Month', '工单类型'].forEach((key) => {
    assert.equal(jq(`[data-strategy-field="${key}"]`).prop('disabled'), false, key);
  });
  assert.equal(jq('[data-strategy-field="RBM保养间隔时间"]').val(), '6');
});

test('条件字段渲染带动态必填标记', () => {
  const html = api.strategyModifyFieldHtml_(
    api.STRATEGY_FIELDS.find((field) => field.key === 'RBM保养间隔时间'),
    5
  );
  assert.match(html, /data-strategy-required="RBM保养间隔时间"/);
});

test('TasklistName 渲染为多选下拉（multiple / size 6）', () => {
  const html = api.strategyModifyFieldHtml_(
    api.STRATEGY_FIELDS.find((field) => field.key === 'TasklistName'),
    9
  );
  assert.match(html, /<select multiple class="form-select" size="6"/);
  assert.match(html, /data-strategy-field="TasklistName"/);
  assert.doesNotMatch(html, /<input/);
});

/* 构造带全部字段值的 jQuery 桩，供收集函数使用 */
function stubWithValues(overrides) {
  const values = fullValues(overrides);
  const initial = {};
  Object.keys(values).forEach((key) => {
    initial[`[data-strategy-field="${key}"]`] = values[key];
  });
  return { jq: makeJQueryStub(initial), values };
}

test('collectStrategyEditFormValues：多选值排序、去空白并保存为 [A,B]', () => {
  const { jq } = stubWithValues();
  jq('[data-strategy-field="TasklistName"]').val([' UV ', 'FCS', '', 'UV']);
  const collected = api.collectStrategyEditFormValues(jq);
  assert.equal(collected['TasklistName'], '[FCS,UV]');
  const p = api.buildStrategyEditPayload('PM-MD-0001', fullOld(), collected, user, '调整清单');
  assert.notEqual(p, null);
  assert.equal(p.fields['TasklistName'], '[FCS,UV]');
});

test('collectStrategyEditFormValues：多选未选择时为 \'\'，builder 判定必填失败', () => {
  const { jq } = stubWithValues();
  jq('[data-strategy-field="TasklistName"]').val([]);
  const collected = api.collectStrategyEditFormValues(jq);
  assert.equal(collected['TasklistName'], '');
  assert.equal(api.buildStrategyEditPayload('PM-MD-0001', fullOld(), collected, user, '调整清单'), null);
});

test('载入主表行时解析 [A,B] 并选中多选', () => {
  const initial = {};
  api.STRATEGY_FIELDS.forEach((field) => {
    initial[`[data-strategy-field="${field.key}"]`] = '';
  });
  const jq = makeJQueryStub(initial);
  api.fillStrategyEditForm(jq, fullOld({ 'TasklistName': '[FCS, UV]' }));
  assert.deepEqual(jq('[data-strategy-field="TasklistName"]').val(), ['FCS', 'UV']);
});

test('载入主表行时 legacy 非方括号值仍可见并选中', () => {
  const initial = {};
  api.STRATEGY_FIELDS.forEach((field) => {
    initial[`[data-strategy-field="${field.key}"]`] = '';
  });
  const jq = makeJQueryStub(initial);
  api.fillStrategyEditForm(jq, fullOld({ 'TasklistName': 'LEGACY-LIST' }));
  assert.deepEqual(jq('[data-strategy-field="TasklistName"]').val(), ['LEGACY-LIST']);
});

/* TasklistName 多选桩：记录 append 的 HTML，支持 find('option') / hasClass / select2 */
function tasklistSelectStub(initialOptions) {
  const state = {
    options: (initialOptions || []).map(function (value) { return { value: value }; }),
    appended: [],
    value: [],
    triggers: [],
    select2Active: false
  };
  const $select = {
    length: 1,
    state: state,
    find: function () {
      return {
        each: function (callback) {
          state.options.forEach(function (option) {
            callback.call({ value: option.value }, 0, { value: option.value });
          });
        }
      };
    },
    append: function (html) {
      state.appended.push(html);
      const re = /<option value="([^"]*)"/g;
      let match;
      while ((match = re.exec(html)) !== null) state.options.push({ value: match[1] });
      return $select;
    },
    hasClass: function (name) {
      return name === 'select2-hidden-accessible' && state.select2Active;
    },
    trigger: function (name) {
      state.triggers.push(name);
      return $select;
    },
    val: function (value) {
      if (arguments.length) {
        state.value = value;
        return $select;
      }
      return state.value;
    },
    select2: function () {
      state.select2Active = true;
      return $select;
    }
  };
  return $select;
}

test('TasklistName 选项带工序前缀，legacy 字符串回退为原始名并转义', () => {
  const select = tasklistSelectStub(['EXISTING']);
  api.strategyModifyAppendTasklistOptions_(null, select, [
    { value: '3AX', label: 'IM - 3AX' },
    { value: 'EXISTING', label: 'TF - EXISTING' },
    'LEGACY-LIST',
    '',
    { value: 'NO-LABEL' },
    { value: '<X>', label: '<IM> - X' }
  ]);

  assert.deepEqual(select.state.appended, [
    '<option value="3AX">IM - 3AX</option>' +
    '<option value="LEGACY-LIST">LEGACY-LIST</option>' +
    '<option value="NO-LABEL">NO-LABEL</option>' +
    '<option value="&lt;X&gt;">&lt;IM&gt; - X</option>'
  ]);
});

test('载入 legacy TasklistName 时补原始名选项，保证值可见', () => {
  const initial = {};
  api.STRATEGY_FIELDS.forEach((field) => {
    initial[`[data-strategy-field="${field.key}"]`] = '';
  });
  const jq = makeJQueryStub(initial);
  const select = tasklistSelectStub([]);
  const wrapped = function (target) {
    if (String(target) === '[data-strategy-field="TasklistName"]') return select;
    return jq(target);
  };

  api.fillStrategyEditForm(wrapped, fullOld({ 'TasklistName': 'LEGACY-LIST' }));

  assert.deepEqual(select.state.value, ['LEGACY-LIST']);
  assert.deepEqual(select.state.appended, ['<option value="LEGACY-LIST">LEGACY-LIST</option>']);
});

test('Select2 初始化参数正确且可重复调用', () => {
  const calls = [];
  const select = tasklistSelectStub([]);
  select.select2 = function (options) {
    calls.push(options);
    this.state.select2Active = true;
    return this;
  };

  api.initStrategyModifyTasklistSelect2_(null, select);
  api.initStrategyModifyTasklistSelect2_(null, select);

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], {
    theme: 'bootstrap-5',
    placeholder: '请选择 / Please select',
    width: '100%',
    closeOnSelect: false,
    allowClear: false
  });
});

test('加载任务清单使用 options 并初始化 Select2', () => {
  const select = tasklistSelectStub([]);
  const jq = makeJQueryStub({});
  const $ = function (target) {
    if (String(target) === '[data-strategy-field="TasklistName"]') return select;
    return jq(target);
  };
  const original = globalThis.google;
  globalThis.google = {
    script: {
      run: {
        withSuccessHandler: function (fn) {
          this._success = fn;
          return this;
        },
        withFailureHandler: function (fn) {
          this._failure = fn;
          return this;
        },
        getStrategyTasklistNames: function () {
          this._success({ ok: true, options: [{ value: '3AX', label: 'IM - 3AX' }] });
        }
      }
    }
  };
  try {
    api.loadStrategyModifyTasklistOptions($);
  } finally {
    if (original === undefined) delete globalThis.google;
    else globalThis.google = original;
  }

  assert.deepEqual(select.state.appended, ['<option value="3AX">IM - 3AX</option>']);
  assert.equal(select.state.select2Active, true);
});

/* 安全回归：URL 参数注入到 <script> 前必须转义 <，防止构造 </script> 逃逸 */
const pageHtml = fs.readFileSync(new URL('./Strategy_Modify.html', import.meta.url), 'utf8');

function strategyInjection_(variable) {
  const match = pageHtml.match(new RegExp('var ' + variable + '=(<\\?![\\s\\S]*?\\?>)'));
  return match ? match[1] : '';
}

test('用户变量注入经过 < 转义', () => {
  ['STRATEGY_JOB_NUMBER', 'STRATEGY_USER_NAME'].forEach((variable) => {
    const expr = strategyInjection_(variable);
    assert.notEqual(expr, '', variable + ' 注入缺失');
    assert.match(expr, /JSON\.stringify\(/, variable + ' 需要 JSON.stringify');
    assert.match(expr, /\.replace\(\/<\//, variable + ' 需要 .replace(/</g 转义');
  });
});

test('不存在未转义的 JSON.stringify 直接输出', () => {
  assert.doesNotMatch(pageHtml, /<\?!=JSON\.stringify\(\s*(?:jobNumber|name)\s*\)\?>/);
});
