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

/** 用假 ctx 跑一次 apply，拿回传给 overrideTokens 的 token 表。 */
async function captureOverrides() {
  const plugin = await loadClientPlugin()
  const calls = []
  const ctx = {
    effect: (fn) => fn(),
    theme: {
      overrideTokens: (source, tokens) => {
        calls.push({ source, tokens })
        return () => {}
      }
    }
  }
  plugin.apply(ctx)
  return { plugin, calls }
}

test('客户端模块只注入 theme 服务', async () => {
  const plugin = await loadClientPlugin()
  assert.deepEqual(plugin.inject, ['theme'])
})

test('apply 以包名为 source 叠加恰好一层 token 覆盖', async () => {
  const { calls } = await captureOverrides()
  assert.equal(calls.length, 1, 'apply 应恰好调用一次 overrideTokens')
  assert.equal(calls[0].source, PKG, 'override 层的 source 必须是包名')
})

test('每个 token 都是 --dsw- 前缀，且 light/dark 均为非空字符串', async () => {
  const { calls } = await captureOverrides()
  const tokens = calls[0].tokens
  const names = Object.keys(tokens)
  assert.ok(names.length >= 25, `token 数量应覆盖主要语义层，实际 ${names.length}`)
  for (const name of names) {
    assert.match(name, /^--dsw-/, `token 名必须带 --dsw- 前缀：${name}`)
    const pair = tokens[name]
    assert.equal(typeof pair, 'object', `${name} 必须是 { light, dark } 对象`)
    assert.equal(typeof pair.light, 'string', `${name}.light 必须是字符串`)
    assert.equal(typeof pair.dark, 'string', `${name}.dark 必须是字符串`)
    assert.ok(pair.light.trim().length > 0, `${name}.light 不能为空`)
    assert.ok(pair.dark.trim().length > 0, `${name}.dark 不能为空`)
    assert.match(pair.light, /^(#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\()/, `${name}.light 应为颜色值`)
    assert.match(pair.dark, /^(#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\()/, `${name}.dark 应为颜色值`)
  }
})

test('CSDN 品牌色落到品牌与主按钮 token，且深浅两套都提供', async () => {
  const { calls } = await captureOverrides()
  const tokens = calls[0].tokens
  assert.equal(tokens['--dsw-alias-brand-primary'].light, '#fc5531')
  assert.equal(tokens['--dsw-alias-button-primary-fill'].light, '#fc5531')
  assert.ok(tokens['--dsw-alias-brand-primary'].dark.length > 0)
  assert.notEqual(tokens['--dsw-alias-label-primary'].light, tokens['--dsw-alias-label-primary'].dark, '浅色与深色的正文色不应相同')
})
