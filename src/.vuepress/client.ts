import { defineClientConfig } from "vuepress/client";
import EnterpriseProfile from "./components/EnterpriseProfile.vue";

export default defineClientConfig({
  enhance({ app }) {
    app.component("EnterpriseProfile", EnterpriseProfile);
  },
});
