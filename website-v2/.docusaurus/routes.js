import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/__docusaurus/debug',
    component: ComponentCreator('/__docusaurus/debug', 'b83'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/config',
    component: ComponentCreator('/__docusaurus/debug/config', '3d4'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/content',
    component: ComponentCreator('/__docusaurus/debug/content', '68a'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/globalData',
    component: ComponentCreator('/__docusaurus/debug/globalData', '438'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/metadata',
    component: ComponentCreator('/__docusaurus/debug/metadata', '4f4'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/registry',
    component: ComponentCreator('/__docusaurus/debug/registry', 'f05'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/routes',
    component: ComponentCreator('/__docusaurus/debug/routes', '40b'),
    exact: true
  },
  {
    path: '/blog',
    component: ComponentCreator('/blog', 'b18'),
    exact: true
  },
  {
    path: '/blog/2016/03/11/blog-post',
    component: ComponentCreator('/blog/2016/03/11/blog-post', 'b81'),
    exact: true
  },
  {
    path: '/blog/2017/04/10/blog-post-two',
    component: ComponentCreator('/blog/2017/04/10/blog-post-two', 'b70'),
    exact: true
  },
  {
    path: '/blog/2017/09/25/testing-rss',
    component: ComponentCreator('/blog/2017/09/25/testing-rss', 'e6d'),
    exact: true
  },
  {
    path: '/blog/2017/09/26/adding-rss',
    component: ComponentCreator('/blog/2017/09/26/adding-rss', '144'),
    exact: true
  },
  {
    path: '/blog/2017/10/24/new-version-1.0.0',
    component: ComponentCreator('/blog/2017/10/24/new-version-1.0.0', '4a4'),
    exact: true
  },
  {
    path: '/blog/archive',
    component: ComponentCreator('/blog/archive', 'b31'),
    exact: true
  },
  {
    path: '/docs',
    component: ComponentCreator('/docs', '0cb'),
    routes: [
      {
        path: '/docs/api/authentication',
        component: ComponentCreator('/docs/api/authentication', '5dd'),
        exact: true,
        sidebar: "docs"
      },
      {
        path: '/docs/api/brainwaves',
        component: ComponentCreator('/docs/api/brainwaves', '10a'),
        exact: true,
        sidebar: "docs"
      },
      {
        path: '/docs/api/calm',
        component: ComponentCreator('/docs/api/calm', 'f52'),
        exact: true,
        sidebar: "docs"
      },
      {
        path: '/docs/api/device-selection',
        component: ComponentCreator('/docs/api/device-selection', 'f79'),
        exact: true,
        sidebar: "docs"
      },
      {
        path: '/docs/api/disconnect',
        component: ComponentCreator('/docs/api/disconnect', '440'),
        exact: true,
        sidebar: "docs"
      },
      {
        path: '/docs/api/focus',
        component: ComponentCreator('/docs/api/focus', '6a9'),
        exact: true,
        sidebar: "docs"
      },
      {
        path: '/docs/api/haptics',
        component: ComponentCreator('/docs/api/haptics', '9aa'),
        exact: true,
        sidebar: "docs"
      },
      {
        path: '/docs/api/info',
        component: ComponentCreator('/docs/api/info', 'b72'),
        exact: true,
        sidebar: "docs"
      },
      {
        path: '/docs/api/kinesis',
        component: ComponentCreator('/docs/api/kinesis', '16e'),
        exact: true,
        sidebar: "docs"
      },
      {
        path: '/docs/api/oauth',
        component: ComponentCreator('/docs/api/oauth', '04b'),
        exact: true,
        sidebar: "docs"
      },
      {
        path: '/docs/api/predictions',
        component: ComponentCreator('/docs/api/predictions', '169'),
        exact: true,
        sidebar: "docs"
      },
      {
        path: '/docs/api/settings',
        component: ComponentCreator('/docs/api/settings', '962'),
        exact: true,
        sidebar: "docs"
      },
      {
        path: '/docs/api/signal-quality',
        component: ComponentCreator('/docs/api/signal-quality', '7ec'),
        exact: true,
        sidebar: "docs"
      },
      {
        path: '/docs/api/status',
        component: ComponentCreator('/docs/api/status', 'a21'),
        exact: true,
        sidebar: "docs"
      },
      {
        path: '/docs/getting-started',
        component: ComponentCreator('/docs/getting-started', '0ee'),
        exact: true,
        sidebar: "docs"
      },
      {
        path: '/docs/guides/ethics',
        component: ComponentCreator('/docs/guides/ethics', 'cbc'),
        exact: true,
        sidebar: "docs"
      },
      {
        path: '/docs/guides/importing',
        component: ComponentCreator('/docs/guides/importing', '639'),
        exact: true,
        sidebar: "docs"
      },
      {
        path: '/docs/guides/signal',
        component: ComponentCreator('/docs/guides/signal', '83e'),
        exact: true,
        sidebar: "docs"
      },
      {
        path: '/docs/guides/training',
        component: ComponentCreator('/docs/guides/training', 'ebd'),
        exact: true,
        sidebar: "docs"
      },
      {
        path: '/docs/overview',
        component: ComponentCreator('/docs/overview', '5f6'),
        exact: true,
        sidebar: "docs"
      },
      {
        path: '/docs/reference/',
        component: ComponentCreator('/docs/reference/', 'eec'),
        exact: true,
        sidebar: "@neurosity/sdk"
      },
      {
        path: '/docs/reference/classes/neurosity',
        component: ComponentCreator('/docs/reference/classes/neurosity', 'b3d'),
        exact: true,
        sidebar: "@neurosity/sdk"
      },
      {
        path: '/docs/reference/interfaces/accelerometer',
        component: ComponentCreator('/docs/reference/interfaces/accelerometer', '85d'),
        exact: true,
        sidebar: "@neurosity/sdk"
      },
      {
        path: '/docs/reference/interfaces/calm',
        component: ComponentCreator('/docs/reference/interfaces/calm', 'a8a'),
        exact: true,
        sidebar: "@neurosity/sdk"
      },
      {
        path: '/docs/reference/interfaces/deviceinfo',
        component: ComponentCreator('/docs/reference/interfaces/deviceinfo', 'e05'),
        exact: true,
        sidebar: "@neurosity/sdk"
      },
      {
        path: '/docs/reference/interfaces/devicestatus',
        component: ComponentCreator('/docs/reference/interfaces/devicestatus', 'a0e'),
        exact: true,
        sidebar: "@neurosity/sdk"
      },
      {
        path: '/docs/reference/interfaces/focus',
        component: ComponentCreator('/docs/reference/interfaces/focus', '5f6'),
        exact: true,
        sidebar: "@neurosity/sdk"
      },
      {
        path: '/docs/reference/interfaces/kinesis',
        component: ComponentCreator('/docs/reference/interfaces/kinesis', '9a7'),
        exact: true,
        sidebar: "@neurosity/sdk"
      },
      {
        path: '/docs/reference/interfaces/powerbyband',
        component: ComponentCreator('/docs/reference/interfaces/powerbyband', 'd8f'),
        exact: true,
        sidebar: "@neurosity/sdk"
      },
      {
        path: '/docs/reference/interfaces/psd',
        component: ComponentCreator('/docs/reference/interfaces/psd', '454'),
        exact: true,
        sidebar: "@neurosity/sdk"
      },
      {
        path: '/docs/reference/interfaces/sdkoptions',
        component: ComponentCreator('/docs/reference/interfaces/sdkoptions', '329'),
        exact: true,
        sidebar: "@neurosity/sdk"
      },
      {
        path: '/docs/reference/interfaces/settings',
        component: ComponentCreator('/docs/reference/interfaces/settings', 'f77'),
        exact: true,
        sidebar: "@neurosity/sdk"
      },
      {
        path: '/docs/reference/interfaces/signalquality',
        component: ComponentCreator('/docs/reference/interfaces/signalquality', '8bd'),
        exact: true,
        sidebar: "@neurosity/sdk"
      },
      {
        path: '/docs/resources',
        component: ComponentCreator('/docs/resources', '8f2'),
        exact: true,
        sidebar: "docs"
      },
      {
        path: '/docs/tutorials/your-first-web-app',
        component: ComponentCreator('/docs/tutorials/your-first-web-app', '537'),
        exact: true,
        sidebar: "docs"
      }
    ]
  },
  {
    path: '/',
    component: ComponentCreator('/', '553'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
