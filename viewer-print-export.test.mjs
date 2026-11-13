import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { extractScript } from './strategy-test-utils.mjs';

const src = extractScript(fs.readFileSync('Print_Export_JS.html', 'utf8'));
const api = new Function(
  `${src}; return { escapePrintHtml, buildPrintFileName, buildPrintHtml, openPrintWindow };`
)();

const HEADERS = [
  { cn: '机型', en: 'Machine Type', width: '16mm' },
  { cn: '任务描述', en: 'Task Description', width: '36mm', align: 'left' },
];

test('文件名带模块、机型和日期', () => {
  assert.equal(
    api.buildPrintFileName('保养', '6AX', new Date(2026, 10, 13)),
    '保养任务清单_6AX_20261113'
  );
  assert.equal(
    api.buildPrintFileName('点检', '', new Date(2026, 0, 5)),
    '点检任务清单_NA_20260105'
  );
});

test('文件名剔除机型空格和非法字符', () => {
  assert.equal(
    api.buildPrintFileName('保养', ' 6AX ', new Date(2026, 10, 13)),
    '保养任务清单_6AX_20261113'
  );
  assert.equal(
    api.buildPrintFileName('保养', 'A/B', new Date(2026, 10, 13)),
    '保养任务清单_A-B_20261113'
  );
  assert.equal(
    api.buildPrintFileName('保养', '   ', new Date(2026, 10, 13)),
    '保养任务清单_NA_20261113'
  );
});

test('打印文档包含标题、双语表头和全部行', () => {
  const rows = [];
  for (let i = 1; i <= 120; i++) rows.push(['6AX', '第' + i + '行']);
  const html = api.buildPrintHtml({
    title: '保养任务清单_6AX_20261113',
    headers: HEADERS,
    rows: rows,
  });

  assert.match(html, /<!DOCTYPE html>/i);
  assert.match(html, /<title>保养任务清单_6AX_20261113<\/title>/);
  assert.ok(html.includes('机型'));
  assert.ok(html.includes('Machine Type'));
  assert.ok(html.includes('<col style="width:16mm">'));
  assert.ok(html.includes('<col style="width:36mm">'));
  assert.ok(html.includes('第1行'));
  assert.ok(html.includes('第120行'));
});

test('第一页显示表格名称', () => {
  const html = api.buildPrintHtml({
    title: '保养任务清单_6AX_20261113',
    heading: '保养任务清单',
    headers: HEADERS,
    rows: [['a', 'b']],
  });

  assert.ok(html.includes('<h1 class="doc-title">保养任务清单</h1>'));
  assert.ok(html.indexOf('保养任务清单</h1>') < html.indexOf('<table>'));
});

test('表格名称做 HTML 转义', () => {
  const html = api.buildPrintHtml({
    title: 't',
    heading: 'A & B',
    headers: HEADERS,
    rows: [],
  });
  assert.ok(html.includes('<h1 class="doc-title">A &amp; B</h1>'));
});

test('单元格内容做 HTML 转义', () => {
  const html = api.buildPrintHtml({
    title: 'A & B',
    headers: HEADERS,
    rows: [['<script>x</script>', 'A & B "q"']],
  });

  assert.ok(html.includes('<title>A &amp; B</title>'));
  assert.ok(html.includes('&lt;script&gt;x&lt;/script&gt;'));
  assert.ok(html.includes('A &amp; B &quot;q&quot;'));
  assert.ok(!html.includes('<script>x</script>'));
  assert.equal(api.escapePrintHtml(null), '');
  assert.equal(api.escapePrintHtml(undefined), '');
});

test('打印样式：A4 横向、表头跨页重复、彩色打印、左对齐列', () => {
  const html = api.buildPrintHtml({
    title: 't',
    headers: HEADERS,
    rows: [['a', 'b']],
  });

  assert.match(html, /@page\s*\{[^}]*size:\s*A4 landscape/);
  assert.match(html, /display:\s*table-header-group/);
  assert.match(html, /print-color-adjust:\s*exact/);
  assert.match(html, /window\.print\(\)/);
  assert.match(html, /addEventListener\("load"/);
  assert.ok(html.includes('class="ta-left"'));
});

test('openPrintWindow 同步打开窗口并写入文档', () => {
  const calls = [];
  const fakeDoc = {
    open() { calls.push('open'); },
    write(html) { calls.push('write:' + html.length); },
    close() { calls.push('close'); },
  };
  const fakeWin = { document: fakeDoc, focus() { calls.push('focus'); } };
  const prev = globalThis.window;
  globalThis.window = {
    open(...args) { calls.push('window.open:' + args.join(',')); return fakeWin; },
  };
  try {
    const ok = api.openPrintWindow({ title: 't', headers: HEADERS, rows: [['a', 'b']] });
    assert.equal(ok, true);
  } finally {
    globalThis.window = prev;
  }
  assert.ok(calls.includes('window.open:, _blank') || calls.some((c) => c.startsWith('window.open:')));
  assert.ok(calls.some((c) => c.startsWith('write:')));
  assert.ok(calls.includes('close'));
  assert.ok(calls.includes('focus'));
});

test('打印窗口被拦截时返回 false', () => {
  const prev = globalThis.window;
  globalThis.window = { open() { return null; } };
  try {
    assert.equal(api.openPrintWindow({ title: 't', headers: HEADERS, rows: [] }), false);
  } finally {
    globalThis.window = prev;
  }
});

test('打印窗口写入异常时返回 false', () => {
  const prev = globalThis.window;
  globalThis.window = {
    open() {
      return {
        document: {
          open() {},
          write() { throw new Error('blocked'); },
          close() {},
        },
        focus() {},
      };
    },
  };
  try {
    assert.equal(api.openPrintWindow({ title: 't', headers: HEADERS, rows: [] }), false);
  } finally {
    globalThis.window = prev;
  }
});

test('打印列定义与弹窗 DataTable 列一致', () => {
  function readArray(file, name) {
    const src = fs.readFileSync(file, 'utf8');
    const m = src.match(new RegExp('const ' + name + ' = \\[([\\s\\S]*?)\\];'));
    assert.ok(m, '未找到 ' + name + ' @ ' + file);
    return m[1];
  }

  function check(file, headerName, keyName) {
    const src = fs.readFileSync(file, 'utf8');
    const headersSrc = readArray(file, headerName);
    const keysSrc = readArray(file, keyName);
    const keys = [...keysSrc.matchAll(/'([^']+)'/g)].map((m) => m[1]);
    const headerCount = (headersSrc.match(/cn:/g) || []).length;
    assert.equal(headerCount, keys.length, file + ' 表头数 != 数据字段数');
    for (const key of keys) {
      assert.ok(
        src.includes("{ data: '" + key + "' }"),
        file + ' 弹窗列缺少: ' + key
      );
    }
  }

  check('Tasklist_Viewer_JS.html', 'PM_PRINT_HEADERS', 'PM_PRINT_KEYS');
  check('Inspection_Viewer_JS.html', 'IN_PRINT_HEADERS', 'IN_PRINT_KEYS');
});

test('两个查阅页接入打印导出', () => {
  const pmJs = fs.readFileSync('Tasklist_Viewer_JS.html', 'utf8');
  const inJs = fs.readFileSync('Inspection_Viewer_JS.html', 'utf8');

  assert.ok(pmJs.includes('导出 PDF / Export PDF'));
  assert.ok(pmJs.includes("buildPrintFileName('保养'"));
  assert.ok(pmJs.includes("heading: '保养任务清单'"));
  assert.ok(pmJs.includes('openPrintWindow({'));
  assert.ok(pmJs.includes('打印窗口被拦截'));

  assert.ok(inJs.includes('导出 PDF / Export PDF'));
  assert.ok(inJs.includes("buildPrintFileName('点检'"));
  assert.ok(inJs.includes("heading: '点检任务清单'"));
  assert.ok(inJs.includes('openPrintWindow({'));
  assert.ok(inJs.includes('打印窗口被拦截'));

  const pmHtml = fs.readFileSync('Tasklist_Viewer.html', 'utf8');
  const inHtml = fs.readFileSync('Inspection_Viewer.html', 'utf8');
  assert.ok(pmHtml.includes('include("Print_Export_JS")'));
  assert.ok(inHtml.includes('include("Print_Export_JS")'));
});
