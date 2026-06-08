import { defineUserConfig } from "vuepress";
import theme from "./theme.js";
import { searchProPlugin } from "vuepress-plugin-search-pro";
import { searchConsolePlugin } from 'vuepress-plugin-china-search-console'

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
  plugins: [

    searchProPlugin({
      // 索引全部内容
      indexContent: true,
    }),
    searchConsolePlugin({
      // options ...
    }),
  ],
  // Enable it with pwa
  // shouldPrefetch: false,
});
