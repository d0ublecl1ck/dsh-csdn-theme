#!/usr/bin/env node
/**
 * 重录 README 里的两张主题截图（浅色 / 深色）。
 *
 * 流程：在本机一个正在运行的 DSH 实例里新建一个会话，把它跑成 Markdown 示例，
 * 再用无头 Chrome 打开该实例的 GUI，点开这个会话，按正文区域截图。
 * 不经过任何图像处理、拼接或后期修饰。
 *
 * 用法：
 *   DSH_HOME="<实例 home>" node scripts/capture-screenshots.mjs [选项]
 *
 * 选项：
 *   --host <host:port>   DSH 实例地址（默认 127.0.0.1:43129）
 *   --port <n>           CDP 调试端口（默认 9333）
 *   --out <dir>          输出目录（默认 <repo>/assets）
 *   --keep               保留这次跑出来的示例会话（默认跑完归档）
 *
 * 环境变量：
 *   DSH_HOME            必填，该实例的 home（内含 .credentials.yaml 与 profiles/）
 *   CHROME_PATH         可选，Chrome 可执行文件路径
 *
 * 前置：该实例已经装好本插件；本机装了 Node 18+（内置 fetch / WebSocket）与 Chrome。
 * 注意：脚本会临时把该实例的 ui-theme.preference 改成 dark，截完立即改回原值。
 */
import { createHash, createHmac, randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = argv.indexOf('--' + name);
  return i === -1 ? fallback : argv[i + 1];
};
const HOME = process.env.DSH_HOME;
const HOST = opt('host', process.env.DSH_HOST || '127.0.0.1:43129');
const PORT = Number(opt('port', '9333'));
const OUT = resolve(opt('out', join(ROOT, 'assets')));
const KEEP = argv.includes('--keep');
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PROFILE = join(process.env.TMPDIR || '/tmp', 'dsh-csdn-theme-shots-' + process.pid);

const PROMPT = '写一段 CSDN 风格的技术博文正文，约 450 字，主题自拟（围绕「用 CSS 变量做主题覆盖」）。'
  + '直接输出 Markdown 正文本身：不要开场白、不要解释、不要用代码围栏把整篇包起来。'
  + '正文必须自然出现：一个二级标题、两个三级标题、加粗、斜体、删除线、行内代码、引用块、'
  + '三列表格（带表头）、无序列表、一个 JavaScript 代码块、一条分隔线、一个链接。'
  + '绝对不要输出任何 HTML 标签（不要 <u>、<kbd> 之类）。不要调用任何工具。';

if (!HOME) {
  console.error('缺少 DSH_HOME：请指向运行中实例的 home 目录（内含 .credentials.yaml）。');
  process.exit(2);
}

/* ---------- Remote API ---------- */
const b64url = (v) => Buffer.from(v).toString('base64').replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
const sha256 = (v) => createHash('sha256').update(v).digest();

function mintCookie(authority) {
  const yaml = readFileSync(join(HOME, '.credentials.yaml'), 'utf8');
  const m = yaml.match(/client-connection\/browser-session:[\s\S]*?\n\s+secret:\s*([A-Za-z0-9_-]+)/u);
  if (m === null) throw new Error('.credentials.yaml 里没有 client-connection/browser-session secret');
  const secret = Buffer.from(m[1].replaceAll('-', '+').replaceAll('_', '/'), 'base64');
  const name = 'dsh-auth-' + b64url(sha256(authority));
  const issuedAt = Date.now();
  const payload = { version: 1, authority, issuedAt, expiresAt: issuedAt + 5 * 60 * 1000 };
  const body = b64url(Buffer.from(JSON.stringify(payload), 'utf8'));
  const sig = b64url(createHmac('sha256', secret).update(body).digest());
  return { name, value: 'v1.' + body + '.' + sig };
}

async function rpc(method, args) {
  const cookie = mintCookie(HOST);
  const res = await fetch('http://' + HOST + '/api/' + method, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      host: HOST,
      origin: 'http://' + HOST,
      cookie: cookie.name + '=' + cookie.value,
    },
    body: JSON.stringify({ type: 'client-request', rpcId: randomUUID(), method, payload: { args } }),
  });
  const body = await res.json();
  const result = body && body.result;
  if (!result || result.ok !== true) {
    throw new Error(method + ' 失败: ' + JSON.stringify(result ? result.error : body));
  }
  return result.value;
}

/* ---------- CDP ---------- */
class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.events = [];
    ws.addEventListener('message', (e) => {
      const m = JSON.parse(e.data);
      if (m.id && this.pending.has(m.id)) {
        const entry = this.pending.get(m.id);
        this.pending.delete(m.id);
        m.error ? entry.reject(new Error(JSON.stringify(m.error))) : entry.resolve(m.result);
      } else if (m.method) {
        this.events.push(m);
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve_, reject) => {
      this.pending.set(id, { resolve: resolve_, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async waitEvent(method, timeout = 40000) {
    const t0 = Date.now();
    while (Date.now() - t0 < timeout) {
      const i = this.events.findIndex((e) => e.method === method);
      if (i >= 0) return this.events.splice(i, 1)[0].params;
      await sleep(100);
    }
    return null;
  }
  async eval(expression) {
    const r = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error('页面求值失败: ' + JSON.stringify(r.exceptionDetails).slice(0, 300));
    return r.result.value;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launchChrome() {
  rmSync(PROFILE, { recursive: true, force: true });
  const child = spawn(CHROME, [
    '--headless=new',
    '--remote-debugging-port=' + PORT,
    '--remote-debugging-address=127.0.0.1',
    '--remote-allow-origins=*',
    '--user-data-dir=' + PROFILE,
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars',
    '--window-size=1240,1560',
    'about:blank',
  ], { stdio: 'ignore', detached: false });
  for (let i = 0; i < 60; i++) {
    try {
      await fetch('http://localhost:' + PORT + '/json/version');
      return child;
    } catch {
      await sleep(250);
    }
  }
  throw new Error('Chrome 没在 15 秒内起来：' + CHROME);
}

async function openTarget(cookie) {
  const target = await (await fetch('http://localhost:' + PORT + '/json/new?about:blank', { method: 'PUT' })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.addEventListener('open', res);
    ws.addEventListener('error', () => rej(new Error('CDP WebSocket 连接失败')));
  });
  const cdp = new CDP(ws);
  await cdp.send('Page.enable');
  await cdp.send('Network.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1240, height: 1560, deviceScaleFactor: 1, mobile: false });
  await cdp.send('Network.setCookie', { name: cookie.name, value: cookie.value, domain: '127.0.0.1', path: '/' });
  return cdp;
}

async function openSession(cdp, workspaceId, sessionId) {
  cdp.events.length = 0;
  await cdp.send('Page.navigate', { url: 'http://' + HOST + '/' });
  await cdp.waitEvent('Page.loadEventFired', 40000);
  await sleep(6000);
  const wsKey = 'workspace:' + workspaceId;
  for (let i = 0; i < 20; i++) {
    const state = await cdp.eval('document.querySelector(\'[data-row-key="' + wsKey + '"]\')?.getAttribute("aria-expanded")');
    if (state === 'true') break;
    if (state === 'false') await cdp.eval('document.querySelector(\'[data-row-key="' + wsKey + '"]\').click()');
    await sleep(800);
  }
  await sleep(1500);
  const clicked = await cdp.eval('(() => { const row = document.querySelector(\'[data-row-key="session:' + sessionId + '"]\'); if (!row) return false; row.click(); return true; })()');
  if (clicked !== true) throw new Error('侧边栏里找不到会话 ' + sessionId + '（工作区是否展开？）');
  for (let i = 0; i < 30; i++) {
    const n = await cdp.eval('document.querySelectorAll(\'[class*="_markdown_"]\').length');
    if (n > 0) break;
    await sleep(800);
  }
  await sleep(3000);
}

async function shoot(cdp, file) {
  const raw = await cdp.eval('(() => {'
    + ' const mds = [...document.querySelectorAll(\'[class*="_markdown_"]\')];'
    + ' const md = mds[mds.length - 1];'
    + ' if (!md) return null;'
    + ' const r = md.getBoundingClientRect();'
    + ' return JSON.stringify({ x: r.x, y: r.y, w: r.width, h: r.height, brand: getComputedStyle(document.body).getPropertyValue("--dsw-alias-brand-primary").trim(), dark: document.body.hasAttribute("data-ds-dark-theme") });'
    + '})()');
  if (!raw) throw new Error('页面上没有 Markdown 正文可截');
  const m = JSON.parse(raw);
  const clip = {
    x: Math.round(m.x - 18),
    y: Math.round(m.y - 12),
    width: Math.round(m.w + 36),
    height: Math.round(m.h + 24),
    scale: 2,
  };
  const shot = await cdp.send('Page.captureScreenshot', { format: 'png', clip });
  writeFileSync(file, Buffer.from(shot.data, 'base64'));
  console.log('  ' + file + '  ' + clip.width * 2 + 'x' + clip.height * 2 + '  brand=' + m.brand + '  dark=' + m.dark);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const cookie = mintCookie(HOST);

  const ws = await rpc('workspace/create', { request: { path: ROOT } });
  const workspaceId = ws.workspace.workspaceId;
  console.log('工作区 ' + workspaceId + '（' + ws.workspace.path + '）');

  const created = await rpc('session/create', { request: { workspaceId } });
  const sessionId = created.sessionId;
  console.log('示例会话 ' + sessionId);
  await rpc('session/prompt', {
    request: {
      requestId: randomUUID(),
      sessionId,
      mode: 'queue',
      content: [{ type: 'text', text: PROMPT }],
      clientTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  console.log('等这一轮跑完…');
  for (let i = 0; i < 90; i++) {
    const list = await rpc('session/list', { _request: {} });
    const item = list.items.find((s) => s.sessionId === sessionId);
    const turn = item && item.projections && item.projections.values.turnOutline && item.projections.values.turnOutline[0];
    if (item && item.running === false && turn && turn.response) break;
    await sleep(4000);
  }

  const chrome = await launchChrome();
  let cdp;
  let restore;
  try {
    cdp = await openTarget(cookie);
    await openSession(cdp, workspaceId, sessionId);
    console.log('浅色：');
    await shoot(cdp, join(OUT, 'screenshot-light.png'));

    const described = await rpc('settings/describe', {});
    const uiTheme = described.namespaces.find((n) => n.ns === 'ui-theme');
    restore = (uiTheme && uiTheme.value && uiTheme.value.preference) || 'system';
    await rpc('settings/mutate', { ns: 'ui-theme', ops: [{ op: 'set', path: ['preference'], value: 'dark' }] });
    await openSession(cdp, workspaceId, sessionId);
    console.log('深色：');
    await shoot(cdp, join(OUT, 'screenshot-dark.png'));
  } finally {
    if (restore !== undefined && cdp) {
      try {
        await rpc('settings/mutate', { ns: 'ui-theme', ops: [{ op: 'set', path: ['preference'], value: restore }] });
        console.log('已把 ui-theme.preference 改回 ' + restore);
      } catch (e) {
        console.error('改回 ui-theme.preference 失败，请手动设回 ' + restore + '：' + e.message);
      }
    }
    if (cdp) cdp.ws.close();
    chrome.kill();
    await sleep(1500);
    try {
      rmSync(PROFILE, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
    } catch (e) {
      console.error('清理临时 Chrome profile 失败（不影响截图）：' + e.message);
    }
    if (!KEEP) {
      try {
        await rpc('workspace/archiveSession', { request: { sessionId } });
        console.log('已归档示例会话');
      } catch (e) {
        console.error('归档示例会话失败（可手动处理）：' + e.message);
      }
    }
  }
}

await main();
