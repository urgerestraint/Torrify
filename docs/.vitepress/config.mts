import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Torrify Docs',
  description: 'Documentation for Torrify - AI-assisted CAD IDE',
  base: '/docs/',
  themeConfig: {
    nav: [
      { text: 'Website', link: 'https://torrify.org/' },
      { text: 'GitHub', link: 'https://github.com/caseyhartnett/torrify' },
      { text: 'Docs Home', link: '/' },
      { text: 'Getting Started', link: '/getting-started/' },
      { text: 'Features', link: '/features/' },
      { text: 'Developer', link: '/developer/' },
      { text: 'Reference', link: '/reference/' }
    ],

    sidebar: {
      '/getting-started/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Overview', link: '/getting-started/' },
            { text: 'Installation', link: '/getting-started/installation' },
            { text: 'Quickstart', link: '/getting-started/QUICKSTART' },
            { text: 'Start App', link: '/getting-started/START_APP' },
            { text: 'Troubleshooting', link: '/getting-started/TROUBLESHOOTING' }
          ]
        }
      ],
      '/features/': [
        {
          text: 'Features',
          items: [
            { text: 'Overview', link: '/features/overview' },
            { text: 'CAD Backends', link: '/features/CAD_BACKENDS' },
            { text: 'AI Integration', link: '/features/LLM_INTEGRATION' },
            { text: 'Settings', link: '/features/SETTINGS' },
            { text: 'Streaming AI', link: '/features/STREAMING_AI' },
            { text: 'Image Import', link: '/features/IMAGE_IMPORT' },
            { text: 'Knowledge Base', link: '/features/KNOWLEDGE_BASE' },
            { text: 'Menu Bar', link: '/features/MENU_BAR' },
            { text: "What's New", link: '/features/WHATS_NEW' },
            { text: 'Parameter Slider Tab (PRO)', link: '/features/PARAMETER_PANEL_PLAN' }
          ]
        }
      ],
      '/developer/': [
        {
          text: 'Developer',
          items: [
            { text: 'Overview', link: '/developer/' },
            { text: 'Developer Guide', link: '/developer/README' },
            { text: 'Testing', link: '/developer/TESTING' },
            { text: 'Architecture', link: '/architecture/' }
          ]
        }
      ],
      '/architecture/': [
        {
          text: 'Architecture',
          items: [
            { text: 'Overview', link: '/architecture/' },
            { text: 'System Architecture', link: '/architecture/ARCHITECTURE' },
            { text: 'Windows Build Requirements', link: '/architecture/WINDOWS_BUILD_REQUIREMENTS' },
            { text: 'Pricing Analysis', link: '/architecture/PRO_PRICING_ANALYSIS' }
          ]
        }
      ],
      '/reference/': [
        {
          text: 'Reference',
          items: [
            { text: 'Overview', link: '/reference/' },
            { text: 'FAQ', link: '/reference/faq' },
            { text: 'Quick Reference', link: '/reference/QUICK_REFERENCE' },
            { text: 'Project Format', link: '/reference/PROJECT_FORMAT' }
          ]
        }
      ],
      '/security/': [
        {
          text: 'Security',
          items: [{ text: 'Security Overview', link: '/security/' }]
        }
      ],
      '/': [
        {
          text: 'General',
          items: [
            { text: 'Documentation Home', link: '/' },
            { text: 'Getting Started', link: '/getting-started/' },
            { text: 'Features', link: '/features/' },
            { text: 'Developer', link: '/developer/' },
            { text: 'Reference', link: '/reference/' },
            { text: 'Security', link: '/security/' }
          ]
        }
      ]
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/caseyhartnett/torrify' }],

    footer: {
      message: 'Released under GPL-3.0.',
      copyright: 'Copyright © 2026 Torrify'
    }
  },
  ignoreDeadLinks: false
})
