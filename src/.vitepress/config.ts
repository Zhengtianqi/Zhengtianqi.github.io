import { defineConfig } from 'vitepress'

export default defineConfig({
  cleanUrls: true,
  base: '/',
  lang: 'zh-CN',
  title: '郑天祺的博客',
  description: '郑天祺的博客',

  head: [
    ['meta', { name: 'bytedance-verification-code', content: 'zjHSprOdFlen2eSs8phv' }],
    ['link', { rel: 'icon', href: '/logo.svg' }]
  ],

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: '郑天祺的博客',

    nav: [
      { text: '首页', link: '/' },
      { text: '关于我', link: '/intro' }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/zhengtianqi' }
    ],

    outline: {
      label: '目录'
    },

    docFooter: {
      prev: '上一页',
      next: '下一页'
    },

    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'long'
      }
    },

    returnToTopLabel: '返回顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',

    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档'
          },
          modal: {
            noResultsText: '无法找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换'
            }
          }
        }
      }
    }
  }
});
