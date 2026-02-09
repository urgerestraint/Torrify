import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Torrify Docs",
  description: "Documentation for Torrify - AI-assisted CAD IDE",
  base: '/docs/',
  appearance: 'dark',
  themeConfig: {
    nav: [
      { text: 'Back to Torrify', link: 'https://torrify.org/' },
      { text: 'Overview', link: '/' },
      { text: 'Getting Started', link: '/getting-started/' },
      { text: 'Features', link: '/features/' },
      { text: 'Developer', link: '/developer/' }
    ],

    sidebar: {
      '/getting-started/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Installation', link: '/getting-started/installation' },
            { text: 'Start Here', link: '/getting-started/START_HERE' },
            { text: 'Quickstart', link: '/getting-started/QUICKSTART' },
            { text: 'Start App', link: '/getting-started/START_APP' },
            { text: 'Troubleshooting', link: '/getting-started/TROUBLESHOOTING' }
          ]
        }
      ],
      '/developer/': [
        {
          text: 'Developer Guide',
          items: [
            { text: 'Getting Started', link: '/developer/getting-started' },
            { text: 'README', link: '/developer/DEV_README' },
            { text: 'Testing', link: '/developer/TESTING' }
          ]
        }
      ],
      '/architecture/': [
        {
          text: 'Architecture',
          items: [
            { text: 'Overview', link: '/architecture/overview' },
            { text: 'Pricing Analysis', link: '/architecture/PRO_PRICING_ANALYSIS' },
            { text: 'Windows Build', link: '/architecture/WINDOWS_BUILD_REQUIREMENTS' }
          ]
        }
      ],
      '/features/': [
        {
          text: 'Features',
          items: [
            { text: 'Overview', link: '/features/overview' },
            { text: 'CAD Backends', link: '/features/CAD_BACKENDS' },
            { text: 'Streaming AI', link: '/features/STREAMING_AI' },
            { text: 'Image Import', link: '/features/IMAGE_IMPORT' },
            { text: 'Knowledge Base', link: '/features/KNOWLEDGE_BASE' },
            { text: 'Menu Bar', link: '/features/MENU_BAR' },
            { text: 'Settings', link: '/features/SETTINGS_FEATURE' },
            { text: 'LLM Integration', link: '/features/LLM_INTEGRATION' },
            { text: 'What\'s New', link: '/features/WHATS_NEW' }
          ]
        }
      ],
      '/reference/': [
        {
          text: 'Reference',
          items: [
            { text: 'FAQ', link: '/reference/faq' },
            { text: 'Quick Reference', link: '/reference/QUICK_REFERENCE' },
            { text: 'Project Format', link: '/reference/PROJECT_FORMAT' },
            { text: 'Doc Index', link: '/reference/DOCUMENTATION_INDEX' }
          ]
        }
      ],
      '/': [
        {
          text: 'General',
          items: [
            { text: 'Next Steps', link: '/NEXT_STEPS' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/caseyhartnett/torrify' }
    ],
    
    footer: {
      message: 'Released under the GPL-3.0 License.',
      copyright: 'Copyright © 2026 Torrify'
    }
  },
  ignoreDeadLinks: true
})
