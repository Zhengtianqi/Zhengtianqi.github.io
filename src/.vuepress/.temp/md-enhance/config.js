import CodeDemo from "D:/work-git/Zhengtianqi.github.io/node_modules/.pnpm/vuepress-plugin-md-enhance@2.0.0-rc.107_@vuepress+bundler-vite@2.0.0-rc.30_@types+node@26.1.0_hney3dv5jdlktb5cdeyudxdxle/node_modules/vuepress-plugin-md-enhance/dist/client/components/CodeDemo.js";
import MdDemo from "D:/work-git/Zhengtianqi.github.io/node_modules/.pnpm/vuepress-plugin-md-enhance@2.0.0-rc.107_@vuepress+bundler-vite@2.0.0-rc.30_@types+node@26.1.0_hney3dv5jdlktb5cdeyudxdxle/node_modules/vuepress-plugin-md-enhance/dist/client/components/MdDemo.js";

export default {
  enhance: ({ app }) => {
    app.component("CodeDemo", CodeDemo);
    app.component("MdDemo", MdDemo);
  },
};
