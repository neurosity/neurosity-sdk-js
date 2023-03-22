module.exports = {
  title: "Neurosity SDK",
  tagline: "Empowering the Mind",
  url: "https://docs.neurosity.co",
  baseUrl: "/",
  organizationName: "neurosity",
  projectName: "neurosity-sdk-js",
  scripts: [
    "https://buttons.github.io/buttons.js",
    "https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/2.0.0/clipboard.min.js",
    "/js/code-block-buttons.js"
  ],
  stylesheets: ["/css/code-block-buttons.css"],
  favicon: "img/favicon.png",
  customFields: {
    repoUrl: "https://github.com/neurosity/neurosity-sdk-js",
    users: [
      {
        caption: "Neurosity SDK",
        image: "img/social-preview.jpg",
        infoLink: "https://github.com/neurosity/neurosity-sdk-js",
        pinned: true
      }
    ]
  },
  onBrokenLinks: "log",
  onBrokenMarkdownLinks: "log",
  presets: [
    [
      "@docusaurus/preset-classic",
      {
        docs: {
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
          path: "../docs",
          sidebarPath: "../website/sidebars.json"
        },
        theme: {
          customCss: "./src/css/customTheme.css"
        }
      }
    ]
  ],
  plugins: [],
  themeConfig: {
    colorMode: {
      defaultMode: "dark",
      disableSwitch: true,
      respectPrefersColorScheme: false
    },
    prism: {
      theme: require("prism-react-renderer/themes/nightOwl")
    },
    navbar: {
      title: "Neurosity SDK",
      logo: {
        src: "img/logo.png"
      },
      items: [
        {
          to: "docs/overview",
          label: "Docs",
          position: "left"
        },
        {
          to: "docs/reference/classes/neurosity",
          label: "Reference",
          position: "left"
        },
        {
          href: "https://github.com/neurosity/neurosity-sdk-js",
          label: "GitHub",
          position: "left"
        },
        {
          href: "https://neurosity.co/discord",
          label: "Need Help?",
          position: "left"
        }
      ]
    },
    image: "img/social-preview.jpg",
    footer: {
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "Getting Started",
              to: "/docs/overview"
            },
            {
              label: "Guides",
              to: "/docs/guides/ethics"
            },
            {
              label: "Tutorials",
              to: "/docs/tutorials/your-first-web-app"
            },
            {
              label: "SDK Reference",
              to: "/docs/reference/classes/neurosity"
            }
          ]
        },
        {
          title: "Community",
          items: [
            {
              label: "Twitter",
              href: "https://twitter.com/neurosity"
            },
            {
              label: "Discord",
              href: "https://neurosity.co/discord"
            },
            {
              label: "Knowledge Base",
              href: "https://support.neurosity.co/hc/en-us"
            },
            {
              label: "Feedback Base",
              href: "https://feedback.neurosity.co/"
            }
          ]
        }
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Neurosity, Inc`
    }
  }
};
