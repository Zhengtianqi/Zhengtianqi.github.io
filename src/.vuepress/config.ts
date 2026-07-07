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

  // 和 PWA 一起启用
  shouldPrefetch: false,
});
