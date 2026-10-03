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
- token 命名空间：宿主语义层 `--dsw-`，语法高亮 `--shiki-`，本插件私有 `--csdn-`。
- 字号不写死 px，一律按比例挂在 `--dsh-content-font-size` 上，保留宿主字号设置。
- 样式表作用域 `[class*="_markdown_"]:not([class*="_compact_"])`；代码块用宿主全局钩子 `md-code-block`。
- 视觉取值都要有来源：颜色取自 CSDN 线上样式表，排版取自博文页的计算样式或样式表，不凭印象写。

## 当前状态与下一步

- 单测 7/7；五道门（manifest / shape / install / compose / activate）全过；样式表在真实浏览器中 36/36 规则解析通过。
- 已在 DSH Desktop（dsh `0.1.7-rc.2`）实测两层都生效：`body` 上有 token 内联覆盖，DOM 里有 `<style data-plugin="dsh-csdn-theme">`；浅色品牌色 `#fc5531`、深色 `#ff6f4d`。真实截图在 `assets/`，重录步骤见 README「怎么重录这两张截图」。
- 已公开：`github.com/d0ublecl1ck/dsh-csdn-theme`；市场收录走 `awesome-dsh-plugin` 目录的 `category: theme` 条目。
- `u` / `kbd` 规则在 DSH 对话里不会触发——DSH 的 Markdown 渲染器转义原始 HTML；保留是为了其他会产出真实元素的场景。
- 未覆盖：`<mark>`、任务列表复选框、KaTeX；h5/h6 没有独立 token，只对齐了外边距。
- 未验证：早于 0.1.7 的 DSH 版本。
