# dsh-csdn-theme

CSDN 风格的 DeepSeek Harness Web 主题。把 CSDN 博文页面的配色与正文排版接进 DSH 网页端，
浅色与深色各一套。

## 它做什么

分两层，都由 `client.js` 在客户端完成，宿主半边是空的：

1. **token 覆盖层** —— `ctx.theme.overrideTokens('dsh-csdn-theme', TOKENS)`
   往当前主题叠一层语义覆盖，每个 token 都给 `{ light, dark }` 两个值。覆盖范围包括
   品牌/文字/边框/底色等 `--dsw-alias-*`、Markdown 排版 `--dsw-font-markdown-*`、
   代码高亮 `--shiki-*`，以及本插件私有的 `--csdn-*`（供第 2 层的样式表取色）。
2. **Markdown 样式表层** —— 追加一个 `<style data-plugin="dsh-csdn-theme">`
   补 token 表达不了的东西：加粗字重、下划线、删除线、链接悬停、引用块左粗边与灰底、
   表格实线网格与斑马纹、分隔线、行内代码、`kbd`、图注、列表缩进等。

两层都是可撤销的：`ctx.effect` 注册的 disposer 分别移除 token 层与 style 标签；
停用插件即整层还原。

## 取值来源（2026-10-03 实测）

配色取自 csdn.net 线上样式表 `csdnimg.cn/release/cmsfe/public/css/common.7303c5f0.css`
的出现频次统计：品牌色 `#fc5531` 出现 151 次，另有 `#222226` / `#555666` / `#999aaa` /
`#ccccd8` 文字阶、`#e8e8ed` / `#f0f0f5` 边框阶、`#f5f6f7` 页面底色。

正文排版取自 CSDN 博文页 `#content_views`（`.markdown_views` / `.htmledit_views`）的
计算样式与样式表：

| 元素 | CSDN 实测 |
| --- | --- |
| 正文 | 16px / 24px，`#4d4d4d`，段落下边距 24px |
| h1、h2 | 22px / 32px，字重 600，`#4f4f4f`，外边距 24px 0 8px |
| h3 / h4 / h5 / h6 | 20/30、18/28、16/26、16/24 |
| 加粗 `strong` | 字重 700 |
| 斜体 `em, i, cite, dfn, var` | italic |
| 下划线 `u` | underline |
| 删除线 `s, del` | line-through |
| 链接 `a` | `#4ea1db`，常态无下划线；hover `#ca0c16`；visited `#6795b5` |
| 行内代码 | `#c7254e` on `#f9f2f4`，内边距 2px 4px，圆角 2px，Source Code Pro |
| 引用块 | 背景 `#eef0f4`，左边框 8px `#dddfe4`，内边距 16px |
| 表格 | 单元格 1px `#dddddd`、内边距 8px、14px/22px；表头底色 `#eff3f5`、字重 700；偶数行 `#f7f7f7` |
| 分隔线 | 1px 实线 `#cccccc`，外边距 24px 0 |
| `kbd` | 白底、1px `rgba(63,63,63,.25)`、`0 1px 0` 阴影、圆角 4px |
| 代码块 | 底色 `#fafafa`，圆角 5px，Source Code Pro 14px/22px |
| 语法高亮 | Atom One Light（深色 Atom One Dark），取自 CSDN 文章实际加载的 highlight 样式 |

字号没有写死：Markdown 的字号/行高按 CSDN 的比例跟随 `--dsh-content-font-size`，
所以设置里的「字号大小」仍然有效。

## 作用域

Markdown 根类在构建产物里形如 `_markdown_1ypvv_5`，样式表用
`[class*="_markdown_"]:not([class*="_compact_"])` 命中：换构建哈希仍然命中，而
`compact` 变体（工具输出等小字号区域）不参与覆盖。代码块用 DSH 的稳定全局钩子
`md-code-block`。

## 文件

| 文件 | 作用 |
| --- | --- |
| `package.json` | 声明 `dsh.bundle.patch` 与 `dsh.client` |
| `cordis.patch.yml` | 往 profile 插入一行 `csdn-theme` |
| `index.js` | 宿主半边，空 `apply` |
| `client.js` | 调色板、字体 token、语法高亮 token、元素级样式表 |
| `test/client.test.mjs` | 7 条单测：模块契约、token 形状与命名空间、字号轴、高亮取值、样式表注入与清理 |

## 本地验证

```sh
npm test
```

## 安装与卸载

```sh
dsh plugin --profile web add "$(pwd)"
dsh --profile web --dump-config | grep -n "dsh-csdn-theme"
dsh plugin --profile web remove dsh-csdn-theme
```

客户端代码只在浏览器里生效：改动后重启宿主或刷新页面。

## 想改

- 颜色：`client.js` 顶部的 `LIGHT` / `DARK` 两张表。
- 排版比例与字重：`TOKENS` 里的 `--dsw-font-markdown-*`。
- 元素级规则：`client.js` 里的 `RULES` 与 `CODE_BLOCK_RULES`。

改完 `npm test`，再重启宿主。

## 已知边界

- 只做视觉覆盖，不改 DOM、不注册设置项；开关就是启用/停用这个插件。
- `compact` 变体不覆盖，避免影响工具输出这类小字号区域。
- 深色侧不是 CSDN 官方换肤（站点未公开深色 token），是按同一套语义调出的深色值。
