import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { extractScript, makeJQueryStub } from './strategy-test-utils.mjs';

const commonSrc = extractScript(fs.readFileSync(new URL('./Strategy_Common_JS.html', import.meta.url), 'utf8'));
const src = extractScript(fs.readFileSync(new URL('./Strategy_Create_JS.html', import.meta.url), 'utf8'));
const api = new Function(`${commonSrc}; ${src}; return { buildStrategyCreatePayload, applyStrategyCreateConditionalState, collectStrategyFormValues, strategyCreateFieldHtml_, appendStrategyCreateTasklistOptions_, initStrategyCreateTasklistSelect2_, loadStrategyCreateTasklistOptions, STRATEGY_FIELDS };`)();

function fullValues(overrides) {
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
    ...(overrides || {})
  };
}

const user = { jobNumber: '10001', name: '林飞' };

test('新建 payload 结构', () => {
  const values = fullValues();
  const p = api.buildStrategyCreatePayload(values, user, '新增');
  assert.equal(p.jobNumber, '10001');
  assert.equal(p.reason, '新增');
  assert.equal(p.fields['工序'], 'IM');
  assert.equal(p.fields['RBM保养间隔时间'], '6');
});

test('缺任意始终必填字段返回 null', () => {
  ['单次停机时间/ h', 'TasklistName', '是否创工单', '是否计入AEM'].forEach((key) => {
    assert.equal(
      api.buildStrategyCreatePayload(fullValues({ [key]: '' }), user, '新增'),
      null,
      key
    );
  });
});

test('RBM 缺条件必填字段返回 null', () => {
  ['RBM保养间隔时间', 'RBM保养提醒间隔时间', '强制保养频率/ Month'].forEach((key) => {
    assert.equal(
      api.buildStrategyCreatePayload(fullValues({ [key]: '' }), user, '新增'),
      null,
      key
    );
  });
});

test('是否创工单 = Y 时工单类型必填', () => {
  assert.equal(api.buildStrategyCreatePayload(fullValues({ '工单类型': '' }), user, '新增'), null);
});

test('非 RBM 规范化三个 RBM 字段为 NA 且不要求必填', () => {
  const values = fullValues({
    '策略 / Strategy': 'TBM',
    'RBM保养间隔时间': '',
    'RBM保养提醒间隔时间': '',
    '强制保养频率/ Month': ''
  });
  const p = api.buildStrategyCreatePayload(values, user, '新增');
  assert.notEqual(p, null);
  assert.equal(p.fields['RBM保养间隔时间'], 'NA');
  assert.equal(p.fields['RBM保养提醒间隔时间'], 'NA');
  assert.equal(p.fields['强制保养频率/ Month'], 'NA');
  assert.equal(values['RBM保养间隔时间'], '', 'builder 不应修改入参');
});

test('是否创工单 = N 时工单类型规范化为 NA', () => {
  const p = api.buildStrategyCreatePayload(fullValues({ '是否创工单': 'N', '工单类型': '' }), user, '新增');
  assert.notEqual(p, null);
  assert.equal(p.fields['工单类型'], 'NA');
});

test('条件字段初始禁用并显示 NA，切换 RBM/Y 后启用并重新计算强制频率', () => {
  const jq = makeJQueryStub({
    '[data-strategy-field="策略 / Strategy"]': 'TBM',
    '[data-strategy-field="是否创工单"]': 'N',
    '[data-strategy-field="PM Frequency"]': '季'
  });
  api.applyStrategyCreateConditionalState(jq);
  ['RBM保养间隔时间', 'RBM保养提醒间隔时间', '强制保养频率/ Month', '工单类型'].forEach((key) => {
    assert.equal(jq(`[data-strategy-field="${key}"]`).prop('disabled'), true, key);
    assert.equal(jq(`[data-strategy-field="${key}"]`).val(), 'NA', key);
  });

  jq('[data-strategy-field="策略 / Strategy"]').val('RBM');
  jq('[data-strategy-field="是否创工单"]').val('Y');
  api.applyStrategyCreateConditionalState(jq);
  ['RBM保养间隔时间', 'RBM保养提醒间隔时间', '强制保养频率/ Month', '工单类型'].forEach((key) => {
    assert.equal(jq(`[data-strategy-field="${key}"]`).prop('disabled'), false, key);
  });
  assert.equal(jq('[data-strategy-field="强制保养频率/ Month"]').val(), '3');
});

test('条件字段渲染带动态必填标记', () => {
  const html = api.strategyCreateFieldHtml_(
    api.STRATEGY_FIELDS.find((field) => field.key === '工单类型'),
    10
  );
  assert.match(html, /data-strategy-required="工单类型"/);
});

test('TasklistName 渲染为多选下拉（multiple / size 6）', () => {
  const html = api.strategyCreateFieldHtml_(
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

test('collectStrategyFormValues：多选值排序、去空白并保存为 [A,B]', () => {
  const { jq } = stubWithValues();
  jq('[data-strategy-field="TasklistName"]').val([' UV ', 'FCS', '', 'UV']);
  const collected = api.collectStrategyFormValues(jq);
  assert.equal(collected['TasklistName'], '[FCS,UV]');
  assert.equal(collected['PM Description'], '季度保养');
  assert.equal(api.buildStrategyCreatePayload(collected, user, '新增')['fields']['TasklistName'], '[FCS,UV]');
});

test('collectStrategyFormValues：多选未选择时为 \'\'，builder 判定必填失败', () => {
  const { jq } = stubWithValues();
  jq('[data-strategy-field="TasklistName"]').val([]);
  const collected = api.collectStrategyFormValues(jq);
  assert.equal(collected['TasklistName'], '');
  assert.equal(api.buildStrategyCreatePayload(collected, user, '新增'), null);
});

test('collectStrategyFormValues：浏览器可能返回单值字符串时也能格式化为 [A]', () => {
  const { jq } = stubWithValues();
  jq('[data-strategy-field="TasklistName"]').val('FCS');
  assert.equal(api.collectStrategyFormValues(jq)['TasklistName'], '[FCS]');
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
  api.appendStrategyCreateTasklistOptions_(null, select, [
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

test('Select2 初始化参数正确且可重复调用', () => {
  const calls = [];
  const select = tasklistSelectStub([]);
  select.select2 = function (options) {
    calls.push(options);
    this.state.select2Active = true;
    return this;
  };

  api.initStrategyCreateTasklistSelect2_(null, select);
  api.initStrategyCreateTasklistSelect2_(null, select);

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
    api.loadStrategyCreateTasklistOptions($);
  } finally {
    if (original === undefined) delete globalThis.google;
    else globalThis.google = original;
  }

  assert.deepEqual(select.state.appended, ['<option value="3AX">IM - 3AX</option>']);
  assert.equal(select.state.select2Active, true);
});

/* 安全回归：URL 参数注入到 <script> 前必须转义 <，防止构造 </script> 逃逸 */
const pageHtml = fs.readFileSync(new URL('./Strategy_Create.html', import.meta.url), 'utf8');

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
