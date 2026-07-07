import { defineUserConfig } from "vuepress";
import theme from "./theme.js";

export default defineUserConfig({
  base: "/",

  lang: "zh-CN",
  title: "郑天祺的博客",
  description: "郑天祺的博客",
  head: [
    // 头条站长验证
    ['meta', { name: 'bytedance-verification-code', content: 'zjHSprOdFlen2eSs8phv' }]
  ],
  theme,
  // 1. 关闭「在 GitHub 上编辑此页」
  editLink: false,
  prevLink: false,
  nextLink: false,
  // 2. 隐藏最近更新时间
  lastUpdated: false,
  // 3. 隐藏贡献者
  contributors: false,
});
