import { hasGlobalComponent } from "D:/work-git/Zhengtianqi.github.io/node_modules/.pnpm/@vuepress+helper@2.0.0-rc.130_@vuepress+bundler-vite@2.0.0-rc.30_@types+node@26.1.0_@vue+comp_cjrmmtzlzy7isdcfrpiujvdtpe/node_modules/@vuepress/helper/dist/client/index.js";
import { useScriptTag } from "D:/work-git/Zhengtianqi.github.io/node_modules/.pnpm/@vueuse+core@14.3.0_vue@3.5.39/node_modules/@vueuse/core/dist/index.js";
import { h } from "vue";
import { VPIcon } from "D:/work-git/Zhengtianqi.github.io/node_modules/.pnpm/@vuepress+plugin-icon@2.0.0-rc.130_@vuepress+bundler-vite@2.0.0-rc.30_@types+node@26.1.0_@vue_cnw4iac3uasqoqfm4qdiwvi4ye/node_modules/@vuepress/plugin-icon/dist/client/index.js"

export default {
  enhance: ({ app }) => {
    if(!hasGlobalComponent("VPIcon")) {
      app.component(
        "VPIcon",
        (props) =>
          h(VPIcon, {
            type: "iconify",
            prefix: "fa6-solid:",
            ...props,
          })
      )
    }
  },
  setup: () => {
    useScriptTag(`https://cdn.jsdelivr.net/npm/iconify-icon@2`);
  },
}
