import { defineClientConfig } from "vuepress/client";
import ChartJS from "D:/work-git/Zhengtianqi.github.io/node_modules/.pnpm/@vuepress+plugin-markdown-chart@2.0.0-rc.130_@vuepress+bundler-vite@2.0.0-rc.30_@types+node@2_fxhbwaykgmertwziacp5ht5jpa/node_modules/@vuepress/plugin-markdown-chart/dist/client/components/ChartJS.js";
import ECharts from "D:/work-git/Zhengtianqi.github.io/node_modules/.pnpm/@vuepress+plugin-markdown-chart@2.0.0-rc.130_@vuepress+bundler-vite@2.0.0-rc.30_@types+node@2_fxhbwaykgmertwziacp5ht5jpa/node_modules/@vuepress/plugin-markdown-chart/dist/client/components/ECharts.js";
import FlowChart from "D:/work-git/Zhengtianqi.github.io/node_modules/.pnpm/@vuepress+plugin-markdown-chart@2.0.0-rc.130_@vuepress+bundler-vite@2.0.0-rc.30_@types+node@2_fxhbwaykgmertwziacp5ht5jpa/node_modules/@vuepress/plugin-markdown-chart/dist/client/components/FlowChart.js";
import MarkMap from "D:/work-git/Zhengtianqi.github.io/node_modules/.pnpm/@vuepress+plugin-markdown-chart@2.0.0-rc.130_@vuepress+bundler-vite@2.0.0-rc.30_@types+node@2_fxhbwaykgmertwziacp5ht5jpa/node_modules/@vuepress/plugin-markdown-chart/dist/client/components/MarkMap.js";
import Mermaid from "D:/work-git/Zhengtianqi.github.io/node_modules/.pnpm/@vuepress+plugin-markdown-chart@2.0.0-rc.130_@vuepress+bundler-vite@2.0.0-rc.30_@types+node@2_fxhbwaykgmertwziacp5ht5jpa/node_modules/@vuepress/plugin-markdown-chart/dist/client/components/Mermaid.js";

export default defineClientConfig({
  enhance: ({ app }) => {
    app.component("ChartJS", ChartJS)
    app.component("ECharts", ECharts);
    app.component("FlowChart", FlowChart);
    app.component("MarkMap", MarkMap);
    app.component("Mermaid", Mermaid);
  },
});
