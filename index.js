/**
 * CSDN 主题的宿主半边。这个 bundle 没有任何宿主行为——调色板通过客户端模块
 * (./client.js) 调 ctx.theme.overrideTokens 叠加，所以宿主侧只保留一个空 apply。
 */
export function apply() {}
