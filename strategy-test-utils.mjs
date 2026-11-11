/**
 * 保养策略审批 — Node 测试工具
 *
 * 供 `strategy-*.test.mjs` 复用：伪造 Google Sheets / Gmail / Session / Utilities，
 * 并把 Code.js 中的应用脚本函数加载为普通对象，便于 `node --test` 直接断言。
 */
import fs from 'node:fs';

const CODE_PATH = new URL('./Code.js', import.meta.url);

/**
 * 把 JS 源码中的注释替换为空格（保留换行与字符位置），
 * 避免把注释里的 `function xxx()` 误判为真实声明。
 * @param {string} src
 * @returns {string}
 */
function maskComments(src) {
  let out = '';
  let i = 0;
  let state = null; // null | "'" | '"' | '`' | '//' | '/*'
  while (i < src.length) {
    const ch = src[i];
    const next = src[i + 1];
    if (state === '//') {
      if (ch === '\n') {
        state = null;
        out += ch;
      } else {
        out += ' ';
      }
      i++;
      continue;
    }
    if (state === '/*') {
      if (ch === '*' && next === '/') {
        state = null;
        out += '  ';
        i += 2;
        continue;
      }
      out += ch === '\n' ? ch : ' ';
      i++;
      continue;
    }
    if (state) {
      out += ch;
      if (ch === '\\') {
        out += next === undefined ? '' : next;
        i += 2;
        continue;
      }
      if (ch === state) state = null;
      i++;
      continue;
    }
    if (ch === '/' && next === '/') {
      state = '//';
      out += '  ';
      i += 2;
      continue;
    }
    if (ch === '/' && next === '*') {
      state = '/*';
      out += '  ';
      i += 2;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      state = ch;
      out += ch;
      i++;
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

/**
 * 扫描 Code.js 顶层的函数与变量声明，生成可导出的名称列表。
 * @param {string} src
 * @returns {string[]}
 */
function collectTopLevelNames(src) {
  const masked = maskComments(src);
  const re = /^(?:function\s+([A-Za-z_$][\w$]*)\s*\(|(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=)/gm;
  const names = [];
  const seen = new Set();
  let match;
  while ((match = re.exec(masked)) !== null) {
    const name = match[1] || match[2];
    if (name && !seen.has(name)) {
      seen.add(name);
      names.push(name);
    }
  }
  return names;
}

let codeFactory = null;

/**
 * 加载 Code.js，返回所有顶层函数与常量的对象。
 * 每次调用都会创建一份新的独立作用域，便于不同测试文件互不影响。
 * @returns {Record<string, *>}
 */
export function loadCode() {
  if (!codeFactory) {
    const src = fs.readFileSync(CODE_PATH, 'utf8');
    const names = collectTopLevelNames(src);
    const exportLines = names
      .map(function (name) {
        const key = JSON.stringify(name);
        return '  if (typeof ' + name + ' !== "undefined") __exports[' + key + '] = ' + name + ';';
      })
      .join('\n');
    codeFactory = new Function(
      src + '\n\nvar __exports = {};\n' + exportLines + '\nreturn __exports;\n'
    );
  }
  return codeFactory();
}

/**
 * 创建伪 Sheet 对象。
 * @param {Array<Array<*>>} [values] 初始二维数据（1-based 读写）
 * @returns {object}
 */
export function makeSheet(values) {
  if (!Array.isArray(values)) values = [];

  function hasValue(value) {
    return value !== '' && value !== null && value !== undefined;
  }

  function getLastRow() {
    for (let r = values.length - 1; r >= 0; r--) {
      const row = values[r] || [];
      for (let c = 0; c < row.length; c++) {
        if (hasValue(row[c])) return r + 1;
      }
    }
    return 0;
  }

  function getLastColumn() {
    let last = 0;
    values.forEach(function (row) {
      row = row || [];
      if (row.length > last) last = row.length;
    });
    return last;
  }

  function readRange(startRow, startCol, numRows, numCols) {
    const result = [];
    if (numRows <= 0 || numCols <= 0) return result;
    for (let r = 0; r < numRows; r++) {
      const sourceRow = values[startRow - 1 + r] || [];
      const resultRow = [];
      for (let c = 0; c < numCols; c++) {
        const value = sourceRow[startCol - 1 + c];
        resultRow.push(value === undefined || value === null ? '' : value);
      }
      result.push(resultRow);
    }
    return result;
  }

  function writeRange(startRow, startCol, matrix) {
    (matrix || []).forEach(function (rowValues, r) {
      const targetRow = startRow - 1 + r;
      while (values.length <= targetRow) values.push([]);
      if (!Array.isArray(values[targetRow])) values[targetRow] = [];
      (rowValues || []).forEach(function (value, c) {
        values[targetRow][startCol - 1 + c] = value;
      });
    });
  }

  function getRange(row, col, numRows, numCols) {
    const startRow = row || 1;
    const startCol = col || 1;
    const rows = numRows === undefined ? 1 : numRows;
    const cols = numCols === undefined ? 1 : numCols;
    return {
      getValues: function () {
        return readRange(startRow, startCol, rows, cols);
      },
      getDisplayValues: function () {
        return readRange(startRow, startCol, rows, cols).map(function (r) {
          return r.map(function (value) {
            return value === '' || value === null || value === undefined ? '' : String(value);
          });
        });
      },
      getValue: function () {
        return readRange(startRow, startCol, 1, 1)[0][0];
      },
      setValues: function (matrix) {
        writeRange(startRow, startCol, matrix);
        return this;
      },
      setValue: function (value) {
        writeRange(startRow, startCol, [[value]]);
        return this;
      },
    };
  }

  const sheet = {
    values: values,
    getLastRow: getLastRow,
    getLastColumn: getLastColumn,
    getRange: getRange,
    getDataRange: function () {
      return getRange(1, 1, getLastRow(), getLastColumn());
    },
    getSheetValues: function (startRow, startCol, numRows, numCols) {
      return readRange(startRow || 1, startCol || 1, numRows || 0, numCols || 0);
    },
    appendRow: function (row) {
      const target = getLastRow();
      while (values.length < target) values.push([]);
      values[target] = Array.isArray(row) ? row.slice() : [row];
      return sheet;
    },
    deleteRow: function (rowNumber) {
      values.splice(rowNumber - 1, 1);
      return sheet;
    },
  };
  return sheet;
}

/**
 * 构造 userID 表的 65 列用户行：A=工号、B=姓名、C=密码、J=GMail、AX=工序、AY=权限。
 * @param {{jobNumber?:string,name?:string,pwd?:string,gmail?:string,process?:string,auth?:string}} [user]
 * @returns {Array<string>}
 */
export function makeUserRow(user) {
  user = user || {};
  const row = new Array(65).fill('');
  row[0] = user.jobNumber === undefined ? '' : user.jobNumber;
  row[1] = user.name === undefined ? '' : user.name;
  row[2] = user.pwd === undefined ? '' : user.pwd;
  row[9] = user.gmail === undefined ? '' : user.gmail;
  row[49] = user.process === undefined ? '' : user.process;
  row[50] = user.auth === undefined ? '' : user.auth;
  return row;
}

/**
 * 安装 GAS 全局桩对象。
 * @param {{sheetsById?:Object<string,Object<string,object>>,sent?:Array, sessionEmail?:string}} [options]
 *   sheetsById: { spreadsheetId: { sheetName: sheet } }
 *   sent: 捕获的 GmailApp.sendEmail 参数数组
 *   sessionEmail: Session.getActiveUser().getEmail() 的返回值
 * @returns {{sheetsById:Object, sent:Array, sessionEmail:string}}
 */
export function installGas(options) {
  options = options || {};
  const sheetsById = options.sheetsById || {};
  const sent = options.sent || [];
  const sessionEmail = options.sessionEmail || 'tester@colpal.com';

  globalThis.SpreadsheetApp = {
    openById: function (id) {
      const sheets = sheetsById[id];
      if (!sheets) throw new Error('installGas: 未配置的 spreadsheet id: ' + id);
      return {
        getSheetByName: function (name) {
          // 与真实 GAS 一致：不存在时返回 null，便于被测代码自行建表。
          return sheets[name] || null;
        },
        insertSheet: function (name) {
          if (sheets[name]) {
            throw new Error('installGas: sheet 已存在: ' + id + ' / ' + name);
          }
          const sheet = makeSheet();
          sheets[name] = sheet;
          return sheet;
        },
      };
    },
  };

  globalThis.GmailApp = {
    sendEmail: function (to, subject, body, mailOptions) {
      const opts = mailOptions || {};
      sent.push({
        to: to,
        subject: subject,
        htmlBody: opts.htmlBody !== undefined ? opts.htmlBody : body,
        cc: opts.cc || '',
      });
    },
  };

  globalThis.Session = {
    getActiveUser: function () {
      return {
        getEmail: function () {
          return sessionEmail;
        },
      };
    },
  };

  globalThis.Utilities = {
    formatDate: function () {
      return '2026-11-11 10:00:00';
    },
  };

  return { sheetsById: sheetsById, sent: sent, sessionEmail: sessionEmail };
}

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 从 JS 源码中提取指定顶层函数的完整源码（含函数声明与函数体）。
 * @param {string} src
 * @param {string} name
 * @returns {string}
 */
export function extractFunction(src, name) {
  const masked = maskComments(src);
  const pattern = new RegExp('^function\\s+' + escapeRegExp(name) + '\\s*\\(', 'm');
  const match = pattern.exec(masked);
  if (!match) throw new Error('extractFunction: 未找到函数 ' + name);

  const openIndex = src.indexOf('{', match.index);
  if (openIndex < 0) throw new Error('extractFunction: 函数 ' + name + ' 缺少函数体');

  let depth = 0;
  let i = openIndex;
  let state = null;
  while (i < src.length) {
    const ch = src[i];
    const next = src[i + 1];
    if (state === '//') {
      if (ch === '\n') state = null;
      i++;
      continue;
    }
    if (state === '/*') {
      if (ch === '*' && next === '/') {
        state = null;
        i += 2;
        continue;
      }
      i++;
      continue;
    }
    if (state) {
      if (ch === '\\') {
        i += 2;
        continue;
      }
      if (ch === state) state = null;
      i++;
      continue;
    }
    if (ch === '/' && next === '/') {
      state = '//';
      i += 2;
      continue;
    }
    if (ch === '/' && next === '*') {
      state = '/*';
      i += 2;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      state = ch;
      i++;
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return src.slice(match.index, i + 1);
    }
    i++;
  }
  throw new Error('extractFunction: 函数 ' + name + ' 的函数体未闭合');
}

/**
 * 提取 HTML 中所有内联 `<script>` 的内容（忽略带 src 的外链脚本）。
 * @param {string} html
 * @returns {string}
 */
export function extractScript(html) {
  const blocks = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    if (/\bsrc\s*=/i.test(match[1] || '')) continue;
    blocks.push(match[2]);
  }
  return blocks.join('\n;\n');
}

/**
 * 创建最小可用的 jQuery 桩，供前端纯函数/页面逻辑测试读取表单值。
 * @param {Object<string,*>} [values] selector → 初始值（例如 { '#remark': 'x' }）
 * @returns {Function} `$` 函数
 */
export function makeJQueryStub(values) {
  const store = new Map(Object.entries(values || {}));

  function element(selector) {
    const key = String(selector);
    const api = {
      selector: key,
      length: store.has(key) ? 1 : 0,
      val: function (value) {
        if (arguments.length) {
          store.set(key, value);
          return api;
        }
        return store.has(key) ? store.get(key) : '';
      },
      text: function (value) {
        if (arguments.length) {
          store.set(key, value);
          return api;
        }
        return store.has(key) ? store.get(key) : '';
      },
      html: function (value) {
        if (arguments.length) {
          store.set(key, value);
          return api;
        }
        return store.has(key) ? store.get(key) : '';
      },
      attr: function (name, value) {
        const dataKey = key + '@' + name;
        if (arguments.length > 1) {
          store.set(dataKey, value);
          return api;
        }
        return store.has(dataKey) ? store.get(dataKey) : '';
      },
      prop: function (name, value) {
        const dataKey = key + '#' + name;
        if (arguments.length > 1) {
          store.set(dataKey, value);
          return api;
        }
        return store.has(dataKey) ? store.get(dataKey) : false;
      },
      data: function (name, value) {
        const dataKey = key + '::' + name;
        if (arguments.length > 1) {
          store.set(dataKey, value);
          return api;
        }
        return store.has(dataKey) ? store.get(dataKey) : undefined;
      },
      is: function () {
        return false;
      },
      each: function (callback) {
        callback.call(api, 0, api);
        return api;
      },
      DataTable: function () {
        const table = {
          rows: function () {
            return { data: function () { return []; } };
          },
          clear: function () { return table; },
          draw: function () { return table; },
          destroy: function () { return table; },
        };
        return table;
      },
      ready: function (callback) {
        if (typeof callback === 'function') callback();
        return api;
      },
    };
    ['on', 'off', 'click', 'append', 'appendTo', 'empty', 'show', 'hide', 'remove',
      'addClass', 'removeClass', 'toggleClass', 'focus', 'trigger', 'modal'].forEach(function (method) {
      api[method] = function () {
        return api;
      };
    });
    return api;
  }

  function jq(target) {
    if (typeof target === 'function') {
      target(jq);
      return element('');
    }
    const key = String(target);
    if (key === 'document' || key === 'window') {
      return {
        ready: function (callback) {
          if (typeof callback === 'function') callback();
          return this;
        },
        on: function () { return this; },
      };
    }
    return element(key);
  }

  jq.fn = {};
  jq.each = function (collection, callback) {
    if (collection && typeof collection.length === 'number') {
      for (let i = 0; i < collection.length; i++) callback(i, collection[i]);
    } else if (collection) {
      Object.keys(collection).forEach(function (key) {
        callback(key, collection[key]);
      });
    }
    return collection;
  };
  jq.extend = function (target) {
    for (let i = 1; i < arguments.length; i++) {
      const source = arguments[i];
      if (source) Object.keys(source).forEach(function (key) { target[key] = source[key]; });
    }
    return target;
  };
  return jq;
}
