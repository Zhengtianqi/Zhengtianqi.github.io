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
  // 开启磁盘缓存，二次构建速度提升50%+
  cache: ".vuepress/.cache",
  // 关闭全局预取/预加载（遍历所有页面，文件越多越卡）
  shouldPrefetch: false,
  shouldPreload: false,
  plugins: [

    searchProPlugin({
      // 索引全部内容
      indexContent: true,
    }),
    searchConsolePlugin({
      // options ...
      toutiaoAutoPushId: "21fca8c35311bd613eb106b7c4596885ddfae59f479386b9ce21f9b588d5a55a8a24d2f724c31ebe20c1e4e6fba6d91caf576100b02a2870c72f38fc574066fef065d152c73bf1cbb2ebad3b5b5265d8",
      autoPushBaiduSwitch: true,
      autoPush360Switch: true,
    }),
  ],
  // Enable it with pwa
  // shouldPrefetch: false,
});
