window.__ModuleLoader__.load({
  id: 'dsh-csdn-theme',
  factory() {
    /*
     * CSDN 调色板。浅色侧取自 csdn.net 线上样式表
     * (csdnimg.cn/release/cmsfe/public/css/common.7303c5f0.css) 里出现频次最高的
     * 品牌色与语义色：#fc5531 出现 151 次，另有 #222226 / #555666 / #999aaa /
     * #ccccd8 文字阶、#e8e8ed / #f0f0f5 边框阶、#f5f6f7 页面底色。
     * 深色侧不是站点换肤（CSDN 未公开深色 token），而是保留 DSH 深色底、
     * 把品牌与语义色抬到深色背景上仍有对比度的同族颜色。
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

    const pair = (light, dark) => ({ light, dark })

    /** token 名 -> 浅色/深色值；两边同值时复用同一个 pair。 */
    const TOKENS = Object.freeze({
      // 品牌与交互
      '--dsw-alias-brand-primary': pair(LIGHT.brand, DARK.brand),
      '--dsw-alias-brand-text': pair(LIGHT.onBrand, DARK.onBrand),
      '--dsw-alias-link': pair(LIGHT.link, DARK.link),
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

      // 对话区 / Markdown / 代码
      '--dsw-alias-markdown-code-block': pair(LIGHT.codeSurface, DARK.codeSurface),
      '--dsw-alias-markdown-code-block-banner': pair(LIGHT.lineSoft, DARK.lineSoft),
      '--dsw-alias-markdown-inline-code': pair(LIGHT.brandSoft, DARK.brandSoft),
      '--dsw-alias-markdown-citation': pair(LIGHT.textSecondary, DARK.textSecondary),
      '--dsw-alias-markdown-tag': pair(LIGHT.page, DARK.raised),
      '--dsw-alias-markdown-placeholder': pair(LIGHT.textTertiary, DARK.textTertiary),
      '--dsw-alias-markdown-code-segment-selected': pair('rgba(252,85,49,0.12)', 'rgba(255,111,77,0.20)'),
      '--dsw-alias-markdown-code-segment-unselected': pair(LIGHT.lineSoft, DARK.lineSoft),
      '--dsw-alias-code-diff-added': pair('rgba(103,194,58,0.14)', 'rgba(127,212,90,0.18)'),
      '--dsw-alias-code-diff-deleted': pair('rgba(245,108,108,0.14)', 'rgba(255,122,122,0.18)'),

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

      // 侧栏与浮层外壳
      '--dsw-alias-scrollbar-bg-l1': pair(LIGHT.line, DARK.line),
      '--dsw-alias-scrollbar-hover-l1': pair(LIGHT.textDimmed, '#4a4a55'),
      '--dsw-alias-settings-card-fill': pair(LIGHT.surface, DARK.surface),
      '--dsw-alias-settings-card-stroke': pair(LIGHT.line, DARK.line),
      '--dsw-alias-tooltip-bg': pair('#222226', '#2f2f36'),
      '--dsw-alias-tooltip-key-bg': pair(LIGHT.lineSoft, DARK.lineSoft),
      '--dsw-alias-toast-bg': pair('#222226', '#2f2f36'),
      '--dsw-alias-toast-label': pair('#ffffff', '#f5f5f7')
    })

    return {
      inject: ['theme'],
      apply(ctx) {
        ctx.effect(
          () => ctx.theme.overrideTokens('dsh-csdn-theme', TOKENS),
          'csdn-theme: CSDN token layer'
        )
      }
    }
  }
})
