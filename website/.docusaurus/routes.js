import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/docs',
    component: ComponentCreator('/docs', 'd82'),
    routes: [
      {
        path: '/docs/api/authentication',
        component: ComponentCreator('/docs/api/authentication', '5dd'),
        exact: true,
        sidebar: "docs"
      },
      {
        path: '/docs/api/bluetooth-react-native',
        component: ComponentCreator('/docs/api/bluetooth-react-native', 'e0e'),
        exact: true,
        sidebar: "docs"
      },
      {
        path: '/docs/api/bluetooth-web',
        component: ComponentCreator('/docs/api/bluetooth-web', '078'),
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
        path: '/docs/api/streaming',
        component: ComponentCreator('/docs/api/streaming', '5c3'),
        exact: true,
        sidebar: "docs"
      },
      {
        path: '/docs/api/v6',
        component: ComponentCreator('/docs/api/v6', '57d'),
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
    component: ComponentCreator('/', '04c'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
