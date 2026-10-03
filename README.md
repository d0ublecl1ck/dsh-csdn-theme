# dsh-csdn-theme

CSDN 风格的 DeepSeek Harness Web 主题。把 CSDN 的品牌色与文字/边框/代码色阶，通过主题
token 覆盖层接入 DSH 网页端，浅色与深色各一套。

## 它做什么

DSH 客户端有一个 `theme` 服务，任何客户端插件都能用
`ctx.theme.overrideTokens(source, tokens)` 往当前主题上叠一层 token 覆盖。本插件只做这一件事：

- `source` 固定为包名 `dsh-csdn-theme`，一个插件一层，卸载即整层撤销；
- 每个 token 都给 `{ light, dark }` 两个值，宿主按当前配色方案取用；
- 覆盖的是语义层 `--dsw-alias-*`，所以亮/暗切换、以及其它插件依赖同一批 token 的地方都会跟着变。

它不改页面结构、不注入额外样式表、不注册设置项，开关就是启用/停用这个插件。

## 调色板从哪来

浅色侧取自 csdn.net 线上样式表
`csdnimg.cn/release/cmsfe/public/css/common.7303c5f0.css` 里出现频次最高的颜色：

| 用途 | 值 | 来源 |
| --- | --- | --- |
| 品牌主色 | `#fc5531` | 该文件出现 151 次，用于主按钮、链接悬停、选中态 |
| 品牌悬停 | `#e9655c` | 主按钮 hover |
| 品牌按下 | `#cc382e` | 主按钮 active |
| 正文 | `#222226` | 出现 46 次 |
| 次要文字 | `#555666` | 出现 59 次 |
| 弱化文字 | `#999aaa` | 出现 61 次 |
| 禁用/占位 | `#ccccd8` | 出现 136 次 |
| 分隔线 | `#e8e8ed` | 出现 61 次 |
| 浅色分隔 | `#f0f0f5` | 出现 21 次 |
| 页面底色 | `#f5f6f7` | 出现 25 次 |
| 代码底色 | `#f7f7fc` | 出现 15 次 |
| 链接 | `#277ccc` | 出现 32 次 |
| 成功/警告/危险/信息 | `#67c23a` / `#e6a23c` / `#f56c6c` / `#409eff` | 该文件的语义色 |

深色侧不是站点换肤（CSDN 未公开深色 token）：保留 DSH 原有深色底 `#151517`，把品牌与
语义色抬到深色背景上仍有对比度的同族颜色（例如品牌色 `#ff6f4d`）。

## 文件

| 文件 | 作用 |
| --- | --- |
| `package.json` | 声明 `dsh.bundle.patch` 与 `dsh.client`，让这个包作为 bundle 被组合 |
| `cordis.patch.yml` | 往 profile 插入一行 `csdn-theme` |
| `index.js` | 宿主半边，空 `apply`：主题全部在客户端完成 |
| `client.js` | 客户端半边：`window.__ModuleLoader__.load` 登记模块，在 `apply` 里叠加 token 层 |
| `test/client.test.mjs` | 单测：模块 id、注入的服务、source 取值、每个 token 的 `{light,dark}` 形状与品牌色落点 |

## 本地验证

```sh
npm test
```

## 安装与卸载

```sh
# 安装到某个 profile（路径按你本机实际情况替换）
dsh plugin --profile web add "$(pwd)"

# 确认配置层被组合出来
dsh --profile web --dump-config | grep -n "dsh-csdn-theme"

# 卸载
dsh plugin --profile web remove dsh-csdn-theme
```

客户端代码只在浏览器里生效：安装后需要重启宿主或刷新页面。

## 想改配色

`client.js` 里 `LIGHT` / `DARK` 两张表就是全部输入，`TOKENS` 只是把它们映射到 token 名。
改值 → `npm test` → 重新安装。

## 已知边界

- 只覆盖 token，不改变布局、间距与字体（字体是 `--dsw-font-*` 系列，本插件不动）。
- 不提供设置面板：想要「CSDN / 默认」来回切，用插件启用状态，或另写一个注册整套主题的插件。
- 覆盖值写在 `document.body` 的行内自定义属性上，优先级高于样式表，因此亮暗两种配色下都取本插件的值。
