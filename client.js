window.__ModuleLoader__.load({
  id: 'dsh-csdn-theme',
  factory() {
    /*
     * 颜色来源分两类：
     *  1) csdn.net 线上样式表与真实文章页的计算样式（#content_views / .htmledit_views /
     *     .markdown_views，2026-10-03 实测）；
     *  2) 代码块语法高亮取 CSDN 文章实际加载的 Atom One Light / Atom One Dark。
     * 深色侧沿用同一套语义，只把明度抬到深色底上仍然可读。
     */
    const LIGHT = {
      brand: '#fc5531',
      brandHover: '#e9655c',
      brandActive: '#cc382e',
      brandSoft: '#fceceb',
      onBrand: '#ffffff',
      link: '#277ccc',
      textPrimary: '#222226',
      textSecondary: '#555666',
      textTertiary: '#999aaa',
      textDimmed: '#ccccd8',
      line: '#e8e8ed',
      lineStrong: '#dcdfe6',
      lineSoft: '#f0f0f5',
      page: '#f5f6f7',
      surface: '#ffffff',
      raised: '#f7f7fc',
      codeSurface: '#f7f7fc',
      success: '#67c23a',
      warning: '#e6a23c',
      danger: '#f56c6c',
      info: '#409eff'
    }

    const DARK = {
      brand: '#ff6f4d',
      brandHover: '#ff8a6e',
      brandActive: '#e04a2a',
      brandSoft: '#3a2019',
      onBrand: '#1c1c20',
      link: '#6cb6ff',
      textPrimary: '#e8e8ed',
      textSecondary: '#b4b6c2',
      textTertiary: '#8a8c99',
      textDimmed: '#5c5e6b',
      line: '#33333c',
      lineStrong: '#3d3d47',
      lineSoft: '#26262d',
      page: '#151517',
      surface: '#1c1c20',
      raised: '#26262b',
      codeSurface: '#26262b',
      success: '#7fd45a',
      warning: '#f0b45a',
      danger: '#ff7a7a',
      info: '#6cb6ff'
    }

    const pair = (light, dark) => ({ light: light, dark: dark })
    const both = (value) => ({ light: value, dark: value })

    /* ---------- 字体栈与排版权重（CSDN 文章正文实测值） ---------- */
    const FONT_STACK = '-apple-system, "SF UI Text", Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif, SimHei, SimSun'
    const CODE_STACK = '"Source Code Pro", "DejaVu Sans Mono", "Ubuntu Mono", "Anonymous Pro", "Droid Sans Mono", Menlo, Consolas, monospace'
    // 字号跟随宿主的会话内容字号设置，只改 CSDN 的字号/行高比例与字重。
    const SIZE = 'var(--dsh-content-font-size,14px)'
    const font = (weight, sizeRatio, lineRatio, family) => {
      const head = weight ? weight + ' ' : ''
      return head + 'calc(' + SIZE + ' * ' + sizeRatio + ') / calc(' + SIZE + ' * ' + lineRatio + ') ' + family
    }

    /** token 名 -> 浅色/深色值。 */
    const TOKENS = Object.freeze({
      // 品牌与交互
      '--dsw-alias-brand-primary': pair(LIGHT.brand, DARK.brand),
      '--dsw-alias-brand-text': pair(LIGHT.onBrand, DARK.onBrand),
      '--dsw-alias-link': pair('#4ea1db', DARK.link),
      '--dsw-alias-button-primary-fill': pair(LIGHT.brand, DARK.brand),
      '--dsw-alias-button-primary-hover': pair(LIGHT.brandHover, DARK.brandHover),
      '--dsw-alias-button-primary-dimmed': pair('#f19f99', '#8a3b2a'),
      '--dsw-alias-button-info-fill': pair(LIGHT.info, DARK.info),
      '--dsw-alias-interactive-bg-hover': pair('rgba(252,85,49,0.08)', 'rgba(255,111,77,0.14)'),
      '--dsw-alias-interactive-bg-hover-accent': pair('rgba(252,85,49,0.14)', 'rgba(255,111,77,0.22)'),
      '--dsw-alias-interactive-bg-active': pair('rgba(252,85,49,0.20)', 'rgba(255,111,77,0.30)'),

      // 底色与边框
      '--dsw-alias-bg-base': pair(LIGHT.surface, DARK.page),
      '--dsw-alias-bg-layer-1': pair(LIGHT.surface, DARK.surface),
      '--dsw-alias-bg-layer-2': pair(LIGHT.raised, DARK.raised),
      '--dsw-alias-bg-layer-3': pair(LIGHT.lineSoft, DARK.lineSoft),
      '--dsw-alias-bg-module-platform': pair(LIGHT.page, DARK.page),
      '--dsw-alias-bg-skeleton': pair(LIGHT.lineSoft, DARK.lineSoft),
      '--dsw-alias-border-l1': pair(LIGHT.lineSoft, DARK.lineSoft),
      '--dsw-alias-border-l2': pair(LIGHT.line, DARK.line),
      '--dsw-alias-border-l3': pair(LIGHT.lineStrong, DARK.lineStrong),
      '--dsw-alias-border-l4': pair(LIGHT.textDimmed, '#4a4a55'),

      // 文字
      '--dsw-alias-label-primary': pair(LIGHT.textPrimary, DARK.textPrimary),
      '--dsw-alias-label-secondary': pair(LIGHT.textSecondary, DARK.textSecondary),
      '--dsw-alias-label-tertiary': pair(LIGHT.textTertiary, DARK.textTertiary),
      '--dsw-alias-label-caption': pair(LIGHT.textTertiary, DARK.textTertiary),
      '--dsw-alias-label-dimmed': pair(LIGHT.textDimmed, DARK.textDimmed),

      // Markdown 代码底色 / 行内代码
      '--dsw-alias-markdown-code-block': pair('#fafafa', '#282c34'),
      '--dsw-alias-markdown-code-block-banner': pair('#f0f0f0', '#21252b'),
      '--dsw-alias-markdown-inline-code': pair('#f9f2f4', '#33222a'),
      '--dsw-alias-markdown-citation': pair(LIGHT.textSecondary, DARK.textSecondary),
      '--dsw-alias-markdown-tag': pair(LIGHT.page, DARK.raised),
      '--dsw-alias-markdown-placeholder': pair(LIGHT.textTertiary, DARK.textTertiary),
      '--dsw-alias-markdown-code-segment-selected': pair('rgba(252,85,49,0.12)', 'rgba(255,111,77,0.20)'),
      '--dsw-alias-markdown-code-segment-unselected': pair(LIGHT.lineSoft, DARK.lineSoft),
      '--dsw-alias-code-diff-added': pair('rgba(80,161,79,0.14)', 'rgba(152,195,121,0.18)'),
      '--dsw-alias-code-diff-deleted': pair('rgba(228,86,73,0.14)', 'rgba(224,108,117,0.18)'),

      // 状态色
      '--dsw-alias-state-success-primary': pair(LIGHT.success, DARK.success),
      '--dsw-alias-state-success-secondary': pair('rgba(103,194,58,0.16)', 'rgba(127,212,90,0.20)'),
      '--dsw-alias-state-success-tertiary': pair('rgba(103,194,58,0.10)', 'rgba(127,212,90,0.12)'),
      '--dsw-alias-state-warn-primary': pair(LIGHT.warning, DARK.warning),
      '--dsw-alias-state-warn-secondary': pair('rgba(230,162,60,0.16)', 'rgba(240,180,90,0.20)'),
      '--dsw-alias-state-error-primary': pair(LIGHT.danger, DARK.danger),
      '--dsw-alias-state-error-secondary': pair('rgba(245,108,108,0.16)', 'rgba(255,122,122,0.20)'),
      '--dsw-alias-state-business-primary': pair(LIGHT.info, DARK.info),
      '--dsw-alias-state-business-tertiary': pair('rgba(64,158,255,0.10)', 'rgba(108,182,255,0.12)'),

      // 外壳
      '--dsw-alias-scrollbar-bg-l1': pair(LIGHT.line, DARK.line),
      '--dsw-alias-scrollbar-hover-l1': pair(LIGHT.textDimmed, '#4a4a55'),
      '--dsw-alias-settings-card-fill': pair(LIGHT.surface, DARK.surface),
      '--dsw-alias-settings-card-stroke': pair(LIGHT.line, DARK.line),
      '--dsw-alias-tooltip-bg': pair('#222226', '#2f2f36'),
      '--dsw-alias-tooltip-key-bg': pair(LIGHT.lineSoft, DARK.lineSoft),
      '--dsw-alias-toast-bg': pair('#222226', '#2f2f36'),
      '--dsw-alias-toast-label': pair('#ffffff', '#f5f5f7'),

      // Markdown 排版（CSDN：正文 16/24、h1 与 h2 22/32、h3 20/30、h4 18/28、表格 14/22、加粗 700）
      '--dsw-font-markdown-base': both(font('', 1, 1.5, 'var(--csdn-font-family)')),
      '--dsw-font-markdown-base-strong': both(font('700', 1, 1.5, 'var(--csdn-font-family)')),
      '--dsw-font-markdown-base-italic': both(font('italic', 1, 1.5, 'var(--csdn-font-family)')),
      '--dsw-font-markdown-h1': both(font('600', 1.375, 2, 'var(--csdn-font-family)')),
      '--dsw-font-markdown-h2': both(font('600', 1.375, 2, 'var(--csdn-font-family)')),
      '--dsw-font-markdown-h3': both(font('600', 1.25, 1.875, 'var(--csdn-font-family)')),
      '--dsw-font-markdown-h4': both(font('600', 1.125, 1.75, 'var(--csdn-font-family)')),
      '--dsw-font-markdown-table': both(font('', 0.875, 1.375, 'var(--csdn-font-family)')),
      '--dsw-font-markdown-table-head': both(font('700', 0.875, 1.375, 'var(--csdn-font-family)')),
      '--dsw-font-markdown-code': both(font('', 0.875, 1.375, 'var(--csdn-code-font)')),
      '--dsw-font-markdown-code-block': both(font('', 0.875, 1.375, 'var(--csdn-code-font)')),
      '--dsw-font-markdown-small': both(font('', 0.75, 1.25, 'var(--csdn-font-family)')),

      // 语法高亮：CSDN 文章实际加载的 Atom One Light / Atom One Dark
      '--shiki-foreground': pair('#383a42', '#abb2bf'),
      '--shiki-background': pair('#fafafa', '#282c34'),
      '--shiki-token-constant': pair('#0184bb', '#56b6c2'),
      '--shiki-token-string': pair('#50a14f', '#98c379'),
      '--shiki-token-comment': pair('#a0a1a7', '#5c6370'),
      '--shiki-token-keyword': pair('#a626a4', '#c678dd'),
      '--shiki-token-parameter': pair('#986801', '#d19a66'),
      '--shiki-token-function': pair('#4078f2', '#61aeee'),
      '--shiki-token-string-expression': pair('#50a14f', '#98c379'),
      '--shiki-token-punctuation': pair('#383a42', '#abb2bf'),
      '--shiki-token-link': pair('#0184bb', '#56b6c2'),

      // 插件私有 token：专供下面的 CSS 覆盖层取用，避免在样式表里写死深浅两套
      '--csdn-font-family': both(FONT_STACK),
      '--csdn-code-font': both(CODE_STACK),
      '--csdn-text': pair('#4d4d4d', '#c9ccd1'),
      '--csdn-heading': pair('#4f4f4f', '#e6e8eb'),
      '--csdn-link': pair('#4ea1db', '#6cb6ff'),
      '--csdn-link-hover': pair('#ca0c16', '#ff7a7a'),
      '--csdn-rule': pair('#cccccc', '#3a3a44'),
      '--csdn-quote-bg': pair('#eef0f4', '#24242a'),
      '--csdn-quote-border': pair('#dddfe4', '#3a3a44'),
      '--csdn-table-border': pair('#dddddd', '#3a3a44'),
      '--csdn-table-head-bg': pair('#eff3f5', '#26262d'),
      '--csdn-table-alt': pair('#f7f7f7', '#202027'),
      '--csdn-inline-code-fg': pair('#c7254e', '#ff8fb0'),
      '--csdn-inline-code-bg': pair('#f9f2f4', '#33222a'),
      '--csdn-code-fg': pair('#383a42', '#abb2bf'),
      '--csdn-code-bg': pair('#fafafa', '#282c34'),
      '--csdn-kbd-bg': pair('#ffffff', '#26262b'),
      '--csdn-kbd-fg': pair('#333333', '#d7d9dd'),
      '--csdn-kbd-border': pair('rgba(63,63,63,0.25)', 'rgba(255,255,255,0.25)'),
      '--csdn-kbd-shadow': pair('0 1px 0 rgba(63,63,63,0.25)', '0 1px 0 rgba(0,0,0,0.6)'),
      '--csdn-figcaption': pair('#999999', '#8a8c99'),
      '--csdn-abbr-border': pair('#999999', '#6b6d78')
    })

    /* ---------- 元素级样式：token 表达不了的部分（内外边距、边框、下划线等） ---------- */
    // Markdown 根类在构建产物里形如 _markdown_1ypvv_5；用子串匹配，升级后换哈希仍命中。
    // compact 变体（工具输出等小字号区域）不参与覆盖。
    const M = '[class*="_markdown_"]:not([class*="_compact_"])'
    const scoped = (selector, body) =>
      selector.split(',').map((s) => M + ' ' + s.trim()).join(', ') + ' { ' + body + ' }'

    const RULES = [
      ['', 'font-family: var(--csdn-font-family) !important; color: var(--csdn-text) !important;'],
      ['p', 'color: var(--csdn-text); line-height: 1.5; margin: 0 0 24px;'],

      // 行内元素：加粗 / 斜体 / 下划线 / 删除线 / 上下标 / 缩写
      ['strong, b', 'font-weight: 700 !important;'],
      ['em, i, cite, dfn, var', 'font-style: italic;'],
      ['u', 'text-decoration: underline; text-underline-offset: 2px;'],
      ['s, del', 'text-decoration: line-through;'],
      ['sub, sup', 'font-size: 0.75em; line-height: 0; position: relative; vertical-align: baseline;'],
      ['abbr[title]', 'cursor: help; border-bottom: 1px dotted var(--csdn-abbr-border); text-decoration: none;'],

      // 链接：CSDN 常态无下划线、hover 转红
      ['a', 'color: var(--csdn-link) !important; font-weight: 400 !important; text-decoration: none;'],
      ['a:hover, a:focus', 'color: var(--csdn-link-hover) !important; text-decoration: underline;'],
      ['a:visited', 'color: var(--csdn-link) !important;'],

      // 标题：CSDN 统一 24px 0 8px 外边距
      ['h1, h2, h3, h4, h5, h6', 'color: var(--csdn-heading); margin: 24px 0 8px;'],

      // 分隔线：CSDN 是 1px 实线 #ccc
      ['hr', 'height: 0 !important; border: none !important; border-bottom: 1px solid var(--csdn-rule) !important; background: none !important; margin: 24px 0 !important;'],

      // 引用块：CSDN 8px 左粗边 + 灰底 + 16px 内边距
      ['blockquote', 'background: var(--csdn-quote-bg); border-left: 8px solid var(--csdn-quote-border); border-radius: 0; margin: 0 0 24px; padding: 16px;'],
      ['blockquote p', 'color: var(--csdn-heading); line-height: 1.625; margin-bottom: 0;'],

      // 行内代码：CSDN 的 Bootstrap 式代码片
      [':not(pre) > code', 'color: var(--csdn-inline-code-fg) !important; background: var(--csdn-inline-code-bg) !important; border: 0 !important; border-radius: 2px !important; padding: 2px 4px !important; font-family: var(--csdn-code-font) !important; font-size: 0.875em !important;'],

      // 键盘按键
      ['kbd', 'display: inline-block; margin: 0 2px; padding: 2px 8px; border: 1px solid var(--csdn-kbd-border); border-radius: 4px; background: var(--csdn-kbd-bg); color: var(--csdn-kbd-fg); box-shadow: var(--csdn-kbd-shadow); font-family: var(--csdn-code-font); font-size: 0.875em; white-space: nowrap;'],

      // 列表：CSDN 的缩进与行距
      ['ul, ol', 'margin: 0 0 24px; padding-left: 40px;'],
      ['ul > li', 'list-style: disc; margin: 8px 0 0;'],
      ['ol > li', 'list-style: decimal; margin: 8px 0 0;'],
      ['li::marker', 'color: var(--csdn-text);'],
      ['li > p', 'margin: 0 0 8px;'],

      // 表格：CSDN 的实线网格 + 斑马纹 + 表头底色
      ['table', 'border-collapse: collapse !important; width: 100% !important; margin: 0 0 24px !important; display: table !important;'],
      ['table th, table td', 'border: 1px solid var(--csdn-table-border) !important; padding: 8px !important; color: var(--csdn-heading) !important; text-align: left !important; font-size: 0.875em !important; line-height: 1.375 !important;'],
      ['table th', 'font-weight: 700 !important; background: var(--csdn-table-head-bg) !important;'],
      ['table tr:nth-child(2n)', 'background: var(--csdn-table-alt) !important;'],

      // 图片与图注
      ['img', 'max-width: 100%; height: auto;'],
      ['figure', 'margin: 0; text-align: center;'],
      ['figcaption', 'margin: 8px 0; color: var(--csdn-figcaption); font-size: 0.875em; text-align: center;'],

      // 定义列表
      ['dl', 'margin: 24px 0;'],
      ['dt', 'margin: 8px 0; font-weight: 700;'],
      ['dd', 'margin: 0 0 8px 40px;']
    ]

    const CODE_BLOCK_RULES = [
      M + ' .md-code-block { --dsl-code-block-border-radius: 5px; --dsl-code-block-background: var(--csdn-code-bg); --dsl-code-block-content-font: ' + font('', 0.875, 1.375, 'var(--csdn-code-font)') + '; }',
      M + ' .md-code-block pre { background: var(--csdn-code-bg) !important; padding: 8px !important; border-radius: 5px !important; }',
      M + ' .md-code-block pre, ' + M + ' .md-code-block pre code, ' + M + ' .md-code-block pre code span { font-family: var(--csdn-code-font) !important; }',
      M + ' .md-code-block pre code { color: var(--csdn-code-fg); }'
    ]

    const CSDN_CSS = RULES.map(([selector, body]) => (selector === '' ? M + ' { ' + body + ' }' : scoped(selector, body)))
      .concat(CODE_BLOCK_RULES)
      .join('\n')

    const STYLE_ID = 'dsh-csdn-theme/markdown-css'

    return {
      inject: ['theme'],
      apply(ctx) {
        ctx.effect(
          () => ctx.theme.overrideTokens('dsh-csdn-theme', TOKENS),
          'csdn-theme: CSDN token layer'
        )
        ctx.effect(() => {
          const tag = document.createElement('style')
          tag.dataset.plugin = 'dsh-csdn-theme'
          tag.dataset.pluginCss = STYLE_ID
          tag.textContent = CSDN_CSS
          document.head.appendChild(tag)
          return () => tag.remove()
        }, 'csdn-theme: CSDN markdown stylesheet')
      }
    }
  }
})
