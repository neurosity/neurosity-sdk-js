/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// See https://docusaurus.io/docs/site-config for all the possible
// site configuration options.

// List of projects/orgs using your project for the users page.
const users = [
  {
    caption: "User1",
    // You will need to prepend the image path with your baseUrl
    // if it is not '/', like: '/test-site/img/image.jpg'.
    image: "/img/undraw_open_source.svg",
    infoLink: "https://www.facebook.com",
    pinned: true
  }
];

const organizationName = "neurosity";
const projectName = "notion-js";
const repoUrl = `https://github.com/${organizationName}/${projectName}`;

const siteConfig = {
  // Used for publishing and more
  organizationName,
  projectName,
  // You may provide arbitrary config keys to be used as needed by your
  // template. For example, if you need your repo's URL...
  // For top-level user or org sites, the organization is still the same.
  // e.g., for the https://JoelMarcey.github.io site, it would be set like...
  //   organizationName: 'JoelMarcey'
  repoUrl,

  title: "Notion", // Title for your website.
  tagline: "Empowering the Mind",
  url: "https://neurosity.co", // Your website URL
  baseUrl: "/", // Base URL for your project */
  // For github.io type URLs, you would set the url and baseUrl like:
  //   url: 'https://facebook.github.io',
  //   baseUrl: '/test-site/',

  // For no header links in the top nav bar -> headerLinks: [],
  headerLinks: [
    { doc: "getting-started", label: "Docs" },
    { doc: "api/calm", label: "API" },
    {
      href: repoUrl,
      label: "GitHub"
    },
    { page: "help", label: "Help" },
    { blog: true, label: "Blog" }
    // { search: true }
  ],

  // If you have users set above, you add it here:
  users,

  /* path to images for header/footer */
  headerIcon: "img/logo.png",
  favicon: "img/favicon.png",

  stylesheets: [
    "https://fonts.googleapis.com/css?family=Roboto:300,400,500,700"
  ],

  /* Colors for website */
  colors: {
    primaryColor: "#000000",
    secondaryColor: "#222222"
  },

  // This copyright info is used in /core/Footer.js and blog RSS/Atom feeds.
  copyright: `Copyright © ${new Date().getFullYear()} Neurosity, Inc`,

  highlight: {
    // Highlight.js theme to use for syntax highlighting in code blocks.
    theme: "dracula"
  },

  // Add custom scripts here that would be placed in <script> tags.
  scripts: ["https://buttons.github.io/buttons.js"],

  // On page navigation for the current documentation page.
  onPageNav: "separate",
  // No .html extensions for paths.
  cleanUrl: true,
  scrollToTopOptions: {
    zIndex: 100
  },
  enableUpdateTime: true,
  enableUpdateBy: true,

  // Open Graph and Twitter card images.
  ogImage: "img/undraw_online.svg",
  twitterImage: "img/undraw_tweetstorm.svg",
  twitterUsername: "neurosity"

  // For sites with a sizable amount of content, set collapsible to true.
  // Expand/collapse the links and subcategories under categories.
  // docsSideNavCollapsible: true,

  // Show documentation's last contributor's name.
  // enableUpdateBy: true,

  // Show documentation's last update time.
  // enableUpdateTime: true,
};

module.exports = siteConfig;
