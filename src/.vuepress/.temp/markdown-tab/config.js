import { CodeTabs } from "D:/work-git/Zhengtianqi.github.io/node_modules/.pnpm/@vuepress+plugin-markdown-tab@2.0.0-rc.130_@vuepress+bundler-vite@2.0.0-rc.30_@types+node@26._zj7wc36n6hb5oyrk66hfv37lsi/node_modules/@vuepress/plugin-markdown-tab/dist/client/components/CodeTabs.js";
import { Tabs } from "D:/work-git/Zhengtianqi.github.io/node_modules/.pnpm/@vuepress+plugin-markdown-tab@2.0.0-rc.130_@vuepress+bundler-vite@2.0.0-rc.30_@types+node@26._zj7wc36n6hb5oyrk66hfv37lsi/node_modules/@vuepress/plugin-markdown-tab/dist/client/components/Tabs.js";

export default {
  enhance: ({ app }) => {
    app.component("CodeTabs", CodeTabs);
    app.component("Tabs", Tabs);
  },
};
