import { hasGlobalComponent } from "D:/work-git/Zhengtianqi.github.io/node_modules/.pnpm/@vuepress+helper@2.0.0-rc.130_@vuepress+bundler-vite@2.0.0-rc.30_@types+node@26.1.0_@vue+comp_cjrmmtzlzy7isdcfrpiujvdtpe/node_modules/@vuepress/helper/dist/client/index.js";
import Badge from "D:/work-git/Zhengtianqi.github.io/node_modules/.pnpm/vuepress-plugin-components@2.0.0-rc.107_@vuepress+bundler-vite@2.0.0-rc.30_@types+node@26.1.0_bwmfzm7o4i3jxqlpjrwy42etqi/node_modules/vuepress-plugin-components/dist/client/components/Badge.js";
import VPCard from "D:/work-git/Zhengtianqi.github.io/node_modules/.pnpm/vuepress-plugin-components@2.0.0-rc.107_@vuepress+bundler-vite@2.0.0-rc.30_@types+node@26.1.0_bwmfzm7o4i3jxqlpjrwy42etqi/node_modules/vuepress-plugin-components/dist/client/components/VPCard.js";

import "D:/work-git/Zhengtianqi.github.io/node_modules/.pnpm/@vuepress+helper@2.0.0-rc.130_@vuepress+bundler-vite@2.0.0-rc.30_@types+node@26.1.0_@vue+comp_cjrmmtzlzy7isdcfrpiujvdtpe/node_modules/@vuepress/helper/dist/client/styles/sr-only.css";

export default {
  enhance: ({ app }) => {
    if(!hasGlobalComponent("Badge")) app.component("Badge", Badge);
    if(!hasGlobalComponent("VPCard")) app.component("VPCard", VPCard);
    
  },
  setup: () => {

  },
  rootComponents: [

  ],
};
