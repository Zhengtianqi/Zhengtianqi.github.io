import { defineUserConfig } from "vuepress";
import theme from "./theme.js";

export default defineUserConfig({
  base: "/",

  lang: "zh-CN",
  title: "郑天祺的博客",
  description: "郑天祺的博客",
  head: [
    // 头条站长验证
    ['meta', { name: 'bytedance-verification-code', content: 'zjHSprOdFlen2eSs8phv' }],
    // Bing 站点验证
    ['meta', { name: 'msvalidate.01', content: 'FAA905D2EF753B2EBC07361E0934C152' }],
    // Google 站点验证
    ['meta', { name: 'google-site-verification', content: 'e-r4NfQLQIKH9qKI_9emDFsuUuEqzPG3mo-ixX0lqyA' }]
  ],
  theme,
});
