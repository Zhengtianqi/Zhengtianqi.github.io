import { navbar } from "vuepress-theme-hope";

export default navbar([
  "/",
  "/intro.html",
  {
    text: "时间线",
    icon: "history",
    link: "/timeline/",
  },
  {
    text: "标签",
    icon: "tag",
    link: "/tag/",
  },
  {
    text: "分类",
    icon: "category",
    link: "/category/",
  },
]);
