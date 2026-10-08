import assert from 'node:assert/strict'
import { test } from 'node:test'

const PKG = 'dsh-csdn-theme'

/** 每次导入换一个说明符，避免 ESM 模块缓存让登记副作用只跑一次。 */
let importSeq = 0

/** 在无浏览器环境下加载 client.js，取出模块加载器登记的工厂产物。 */
async function loadClientPlugin() {
  let captured
  globalThis.window = { __ModuleLoader__: { load: (mod) => { captured = mod } } }
  try {
    await import(`../client.js?t=${++importSeq}`)
  } finally {
    delete globalThis.window
  }
  assert.ok(captured, 'client.js 必须调用 window.__ModuleLoader__.load 登记模块')
  assert.equal(captured.id, PKG, '客户端模块 id 必须等于包名')
  assert.equal(typeof captured.factory, 'function', 'client.js 必须提供 factory')
  return captured.factory(() => { throw new Error('本插件不依赖浏览器模块表') })
}

/** 极简 document 替身：只覆盖插件用到的 createElement / head.append / remove。 */
function fakeDocument() {
  const appended = []
  return {
    appended,
    createElement(tag) {
      return {
        tagName: String(tag).toUpperCase(),
        dataset: {},
        textContent: '',
        removed: false,
        remove() {
          this.removed = true
          const index = appended.indexOf(this)
          if (index >= 0) appended.splice(index, 1)
        }
      }
    },
    head: {
      append: (el) => { appended.push(el) },
      appendChild: (el) => { appended.push(el); return el }
    }
  }
}

/** 假 ctx + 假 document 跑一次 apply，收集 disposer 以便验证清理。 */
async function applyWithFakeCtx() {
  const plugin = await loadClientPlugin()
  const document = fakeDocument()
  const calls = []
  const disposers = []
  const ctx = {
    effect: (fn) => { disposers.push(fn()) },
    theme: {
      overrideTokens: (source, tokens) => {
        calls.push({ source, tokens })
        return () => { calls.length = 0 }
      }
    }
  }
  const previousDocument = globalThis.document
  globalThis.document = document
  try {
    plugin.apply(ctx)
  } finally {
    globalThis.document = previousDocument
  }
  return { plugin, calls, disposers, document }
}

test('客户端模块只注入 theme 服务', async () => {
  const plugin = await loadClientPlugin()
  assert.deepEqual(plugin.inject, ['theme'])
})

test('apply 以包名为 source 叠加恰好一层 token 覆盖', async () => {
  const { calls } = await applyWithFakeCtx()
  assert.equal(calls.length, 1, 'apply 应恰好调用一次 overrideTokens')
  assert.equal(calls[0].source, PKG, 'override 层的 source 必须是包名')
})

test('每个 token 都是 --dsw- 或插件私有 --csdn- 前缀，且 light/dark 均为颜色值', async () => {
  const { calls } = await applyWithFakeCtx()
  const tokens = calls[0].tokens
  const names = Object.keys(tokens)
  assert.ok(names.length >= 60, `token 数量应覆盖调色板与 Markdown 排版，实际 ${names.length}`)
  for (const name of names) {
    assert.match(name, /^--(dsw|shiki|csdn)-/, `token 名必须落在已覆盖的命名空间（--dsw- / --shiki- / --csdn-）：${name}`)
    const pair = tokens[name]
    assert.equal(typeof pair, 'object', `${name} 必须是 { light, dark } 对象`)
    assert.equal(typeof pair.light, 'string', `${name}.light 必须是字符串`)
    assert.equal(typeof pair.dark, 'string', `${name}.dark 必须是字符串`)
    assert.ok(pair.light.trim().length > 0, `${name}.light 不能为空`)
    assert.ok(pair.dark.trim().length > 0, `${name}.dark 不能为空`)
  }
})

test('CSDN 品牌色落到品牌与主按钮 token，且深浅两套都提供', async () => {
  const { calls } = await applyWithFakeCtx()
  const tokens = calls[0].tokens
  assert.equal(tokens['--dsw-alias-brand-primary'].light, '#fc5531')
  assert.equal(tokens['--dsw-alias-button-primary-fill'].light, '#fc5531')
  assert.ok(tokens['--dsw-alias-brand-primary'].dark.length > 0)
  assert.notEqual(tokens['--dsw-alias-label-primary'].light, tokens['--dsw-alias-label-primary'].dark, '浅色与深色的正文色不应相同')
})

test('Markdown 字体 token 保留字号轴，不写死 px 字号', async () => {
  const { calls } = await applyWithFakeCtx()
  const tokens = calls[0].tokens
  const base = tokens['--dsw-font-markdown-base']
  assert.ok(base, '必须覆盖 --dsw-font-markdown-base')
  assert.match(base.light, /--dsh-content-font-size/, '正文排版必须跟随宿主字号设置')
  const strong = tokens['--dsw-font-markdown-base-strong']
  assert.match(strong.light, /^700 /, '加粗档位应是 700（CSDN 取值）')
  assert.match(tokens['--csdn-font-family'].light, /PingFang SC/, '字体栈采用 CSDN 的顺序')
  assert.match(tokens['--csdn-font-family'].light, /^\-apple\-system, "SF UI Text"/, 'CSDN 的字体栈首位是系统字体，随后是 SF UI Text')
})

test('语法高亮 token 走 Atom One Light / One Dark', async () => {
  const { calls } = await applyWithFakeCtx()
  const tokens = calls[0].tokens
  assert.equal(tokens['--shiki-token-keyword'].light, '#a626a4')
  assert.equal(tokens['--shiki-token-string'].light, '#50a14f')
  assert.equal(tokens['--shiki-token-keyword'].dark, '#c678dd')
  assert.equal(tokens['--shiki-token-string'].dark, '#98c379')
})

test('apply 注入一个带包名标记的 style 标签，清理时移除', async () => {
  const { disposers, document } = await applyWithFakeCtx()
  assert.equal(document.appended.length, 1, 'apply 应恰好追加一个 style 标签')
  const tag = document.appended[0]
  assert.equal(tag.tagName, 'STYLE')
  assert.equal(tag.dataset.plugin, PKG, 'style 标签必须带 data-plugin 标记以便排查与清理')
  assert.match(tag.textContent, /md-code-block/, '样式表应包含代码块钩子')
  assert.match(tag.textContent, /_markdown_/, '样式表应作用域到 Markdown 根类')
  assert.match(tag.textContent, /strong[^{]*\{[^}]*font-weight:\s*700/, '样式表应把加粗固定为 700')
  assert.ok(!tag.removed)
  assert.equal(disposers.length, 2, 'theme 层与样式表各需要一个 disposer')
  for (const dispose of disposers) dispose()
  assert.ok(tag.removed, '清理函数必须移除 style 标签')
  assert.equal(document.appended.length, 0)
})

/* ---------- 验收回归：hover 快捷键提示（tooltip 里的 kbd 徽标） ---------- */

/** 解析 #rgb / #rrggbb。 */
function parseHex(value) {
  const hex = value.trim().replace(/^#/u, '')
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex
  assert.match(full, /^[0-9a-fA-F]{6}$/u, `无法解析的颜色：${value}`)
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16))
}

/**
 * 解析主题 token 值，覆盖本插件用到的两种写法：
 *   #rrggbb / #rgb
 *   color-mix(in srgb, <颜色|var(--token)>, white <n>%)
 * 宿主自己就是用 color-mix(in srgb, var(--dsw-alias-tooltip-bg), white 18%) 定义徽标底色的。
 */
function resolveColor(value, tokens, theme, depth = 0) {
  const text = value.trim()
  if (/^#[0-9a-fA-F]{3,6}$/u.test(text)) return parseHex(text)
  const mix = text.match(/^color-mix\(\s*in srgb\s*,\s*(.+?)\s*,\s*white\s+([\d.]+)%\s*\)$/u)
  if (mix === null) return null
  const source = /^var\(/u.test(mix[1]) ? tokens[mix[1].slice(4, -1)] : null
  const from = resolveColor(source ? source[theme] : mix[1], tokens, theme, depth + 1)
  if (from === null || depth > 4) return null
  const ratio = Number(mix[2]) / 100
  return from.map((channel) => Math.round(channel * (1 - ratio) + 255 * ratio))
}

/** WCAG 相对亮度。 */
function luminance(rgb) {
  const [r, g, b] = rgb.map((channel) => {
    const c = channel / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG 对比度。 */
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const WHITE = [255, 255, 255]

test('tooltip 快捷键徽标底色由 tooltip 底色提亮而来，白字对比度达标', async () => {
  const { calls } = await applyWithFakeCtx()
  const tokens = calls[0].tokens
  const keyBg = tokens['--dsw-alias-tooltip-key-bg']
  assert.ok(keyBg, '必须覆盖 --dsw-alias-tooltip-key-bg，host 用它画快捷键徽标底色')
  assert.notEqual(keyBg.light, tokens['--dsw-alias-bg-layer-3'].light, '徽标底色不能复用面板浅底')

  for (const theme of ['light', 'dark']) {
    const resolved = resolveColor(keyBg[theme], tokens, theme)
    assert.ok(resolved !== null, `${theme} 的徽标底色必须是可解析的颜色：${keyBg[theme]}`)
    const ratio = contrast(resolved, WHITE)
    assert.ok(
      ratio >= 4.5,
      `${theme} 下 ${keyBg[theme]} 与白色按键字形对比度只有 ${ratio.toFixed(2)}:1，会看不清`
    )
  }

  // 负向断言：修复前的浅底 #f0f0f5 确实不达标 —— 证明这条检查能抓住本缺陷。
  assert.ok(contrast(parseHex('#f0f0f5'), WHITE) < 4.5, '旧值必须被判为不合格，否则该检查形同虚设')
})

