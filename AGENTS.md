# AGENTS.md

DSH Web 主题插件 `dsh-csdn-theme`：把 CSDN 博文的配色与正文排版接进 DeepSeek Harness 网页端。

## 怎么跑

```sh
npm test                                  # 单测（node --test）
dsh plugin --profile web add "$(pwd)"     # 装进某个 profile
dsh --profile web --dump-config | grep dsh-csdn-theme
dsh plugin --profile web remove dsh-csdn-theme
```

客户端代码只在浏览器里生效：改动后重启宿主或刷新页面。

## 技术栈

- 纯 ESM，无构建、无依赖。
- `client.js` 不是普通 ESM：它由宿主的浏览器模块加载器执行，入口是 `window.__ModuleLoader__.load`。
- 宿主半边 `index.js` 只导出空的 `apply`。
- 样式分两层：`ctx.theme.overrideTokens` 的 token 覆盖层 + 一个 `<style data-plugin="dsh-csdn-theme">` 元素级样式表。

## 目录与约定

- `client.js` — 唯一实现：调色板、token 表、元素级样式表。
- `test/client.test.mjs` — 全部单测；改行为先在这里加断言。
- `cordis.patch.yml` — 往 profile 插入行 `csdn-theme`。
- `scripts/capture-screenshots.mjs` — 重录 README 两张截图的链路；用法与前置见脚本头部注释（`DSH_HOME=<实例 home> node scripts/capture-screenshots.mjs`），跑它会在实例里开一个示例会话并归档，中途会临时改 `ui-theme.preference` 再改回。
- token 命名空间：宿主语义层 `--dsw-`，语法高亮 `--shiki-`，本插件私有 `--csdn-`。
- 字号不写死 px，一律按比例挂在 `--dsh-content-font-size` 上，保留宿主字号设置。
- 样式表作用域 `[class*="_markdown_"]:not([class*="_compact_"])`；代码块用宿主全局钩子 `md-code-block`。
- README 的截图用 GitHub raw 外链，因为 npm 的 `files` 白名单不含 `assets/`，相对路径在 npm 包页会裂；`screenshots.json`（市场详情页）仍用仓库内相对路径。
- 视觉取值都要有来源：颜色取自 CSDN 线上样式表，排版取自博文页的计算样式或样式表，不凭印象写。

## 发布到 npm

包名 `dsh-csdn-theme`，2026-10-03 首次发布 `0.2.0`，2026-10-08 发布 `0.2.2`（tooltip 快捷键徽标对比度修复）与 `0.2.3`（README 截图改 raw 外链，修复 npm 包页裂图）；`0.2.1` 不含 tooltip 修复。发布源固定在 `package.json` 的 `publishConfig.registry`（npmjs.org）—— 本机默认 registry 是 npmmirror 镜像，所以不要手动加 `--registry`。

```sh
npm publish          # 发新版前先改 package.json 里的 version
```

账号只绑了**通行密钥**（没有 TOTP App），命令行拿不到 6 位码，所以现在靠 `~/.npmrc` 里一条 **granular token + bypass 2FA** 发布（该 token 有效期到 2027-01-01）。

**这条路有截止时间**：npm 从 **2027 年 1 月**起禁止绕过 2FA 的 token 直接发布。到期前必须迁到 GitHub Actions 的 trusted publishing（OIDC），否则会重新卡在 `EOTP` —— 换普通 granular token 也一样不行。

## 当前状态与下一步

- 单测 8/8；五道门（manifest / shape / install / compose / activate）全过；样式表在真实浏览器中 36/36 规则解析通过。
- 已在 DSH Desktop（dsh `0.1.7-rc.2`）实测两层都生效：`body` 上有 token 内联覆盖，DOM 里有 `<style data-plugin="dsh-csdn-theme">`；浅色品牌色 `#fc5531`、深色 `#ff6f4d`。真实截图在 `assets/`，重录方式见 `scripts/capture-screenshots.mjs` 头部注释。
- 已发布 npm：`dsh-csdn-theme@0.2.3`（2026-10-08，latest），`repository` 指回本仓库，目录侧的 npm 映射会自动关联，无需手动申报。
- 已建 GitHub Release `v0.2.3`（tag 指向 `45f5604`，正文含 tooltip 修复前后对比图并作为 Release 附件）—— 前后对比这类「修了什么」的图放这里，不放 README 首屏与市场详情页；后续发版同步建 Release。
- 已公开：`github.com/d0ublecl1ck/dsh-csdn-theme`；市场收录已提 PR（`awesome-dsh-plugin/awesome-dsh-plugin#6474`，`category: theme`），等对方 CI 的仓库年龄门自动放行，无需重提。
- 悬浮 tooltip 的快捷键徽标底色已改为由 `--dsw-alias-tooltip-bg` 提亮派生（2026-10-08 实测修复）：白色键位字形的对比度浅色 8.83:1、深色 7.52:1，旧值 `#f0f0f5` 只有 1.14:1。
- `u` / `kbd` 规则在 DSH 对话里不会触发——DSH 的 Markdown 渲染器转义原始 HTML；保留是为了其他会产出真实元素的场景。
- 未覆盖：`<mark>`、任务列表复选框、KaTeX；h5/h6 没有独立 token，只对齐了外边距。
- 未验证：早于 0.1.7 的 DSH 版本。
