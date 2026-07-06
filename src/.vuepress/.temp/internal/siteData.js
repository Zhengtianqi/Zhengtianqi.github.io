export const siteData = JSON.parse("{\"base\":\"/\",\"lang\":\"zh-CN\",\"title\":\"郑天祺的博客\",\"description\":\"郑天祺的博客\",\"head\":[[\"meta\",{\"name\":\"bytedance-verification-code\",\"content\":\"zjHSprOdFlen2eSs8phv\"}]],\"locales\":{\"/\":{\"lang\":\"zh-CN\",\"title\":\"郑天祺的博客\",\"description\":\"郑天祺的博客\"}}}")

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
  __VUE_HMR_RUNTIME__.updateSiteData?.(siteData)
}

if (import.meta.hot) {
  import.meta.hot.accept((m) => {
    __VUE_HMR_RUNTIME__.updateSiteData?.(m.siteData)
  })
}
