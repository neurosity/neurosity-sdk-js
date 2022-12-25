module.exports = {
  title: "Neurosity SDK",
  tagline: "Empowering the Mind",
  url: "https://neurosity.co",
  baseUrl: "/",
  organizationName: "neurosity",
  projectName: "neurosity-sdk-js",
  scripts: [
    "https://buttons.github.io/buttons.js",
    "https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/2.0.0/clipboard.min.js",
    "/js/code-block-buttons.js"
  ],
  stylesheets: [
    "https://fonts.googleapis.com/css?family=Roboto:300,400,500,700",
    "/css/code-block-buttons.css"
  ],
  favicon: "img/favicon.png",
  customFields: {
    repoUrl: "https://github.com/neurosity/neurosity-sdk-js",
    users: [
      {
        caption: "User1",
        image: "/img/undraw_open_source.svg",
        infoLink: "https://www.facebook.com",
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
        blog: {
          path: "blog"
        },
        theme: {
          customCss: "./src/css/customTheme.css"
        }
      }
    ]
  ],
  plugins: [],
  themeConfig: {
    navbar: {
      title: "Neurosity SDK",
      logo: {
        src: "img/logo.png"
      },
      items: [
        {
          to: "docs/getting-started",
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
          href: "https://support.neurosity.co",
          label: "Need Help?",
          position: "left"
        }
      ]
    },
    image: "img/undraw_online.svg",
    footer: {
      links: [
        {
          title: "Community",
          items: [
            {
              label: "Twitter",
              to: "https://twitter.com/neurosity"
            }
          ]
        }
      ],
      copyright: "Copyright © 2022 Neurosity, Inc",
      logo: {
        src: "img/favicon.png"
      }
    }
  }
};
