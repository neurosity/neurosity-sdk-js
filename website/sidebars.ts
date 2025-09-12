import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  docs: {
    Overview: ["overview"],
    "Get Started": [
      "tutorials/your-first-node-app",
      "tutorials/your-first-web-app",
      "resources"
    ],
    "Working with the SDK": [
      "guides/ethics",
      "guides/importing",
      "guides/signal",
      "guides/training"
    ],
    "API Guides": [
      "api/device-selection",
      "api/info",
      "api/status",
      "api/authentication",
      "api/oauth",
      "api/settings",
      "api/signal-quality",
      "api/brainwaves",
      "api/focus",
      "api/calm",
      "api/kinesis",
      "api/predictions",
      "api/streaming",
      "api/osc",
      "api/haptics",
      "api/disconnect",
      "api/bluetooth-web",
      "api/bluetooth-react-native",
      "api/v7",
      "api/v6"
    ]
  },
  "@neurosity/sdk": {
    Introduction: ["reference/README"],
    Classes: [
      "reference/classes/Neurosity",
      "reference/classes/BluetoothClient",
      "reference/classes/ReactNativeTransport",
      "reference/classes/WebBluetoothTransport"
    ],
    Enumerations: ["reference/enumerations/STREAMING_MODE"],
    Functions: ["reference/functions/osHasBluetoothSupport"],
    Interfaces: [
      "reference/interfaces/Accelerometer",
      "reference/interfaces/BaseInfo",
      "reference/interfaces/Calm",
      "reference/interfaces/DeviceInfo",
      "reference/interfaces/DeviceStatus",
      "reference/interfaces/Epoch",
      "reference/interfaces/EpochInfo",
      "reference/interfaces/Focus",
      "reference/interfaces/Kinesis",
      "reference/interfaces/PSD",
      "reference/interfaces/PSDInfo",
      "reference/interfaces/PowerByBand",
      "reference/interfaces/RawUnfilteredEpoch",
      "reference/interfaces/RawUnfilteredEpochInfo",
      "reference/interfaces/SDKOptions",
      "reference/interfaces/Settings",
      "reference/interfaces/SignalQuality"
    ],
    "Type Aliases": [
      "reference/type-aliases/AmplitudeByChannel",
      "reference/type-aliases/AwarenessLabels",
      "reference/type-aliases/BandName",
      "reference/type-aliases/BluetoothTransport",
      "reference/type-aliases/BrainwavesLabel",
      "reference/type-aliases/Credentials",
      "reference/type-aliases/CustomToken",
      "reference/type-aliases/DeviceSelector",
      "reference/type-aliases/EmailAndPassword",
      "reference/type-aliases/Experiment",
      "reference/type-aliases/HapticEffects",
      "reference/type-aliases/OAuthConfig",
      "reference/type-aliases/OAuthCredentials",
      "reference/type-aliases/OAuthQuery",
      "reference/type-aliases/OAuthQueryResult",
      "reference/type-aliases/OAuthRemoveResponse",
      "reference/type-aliases/OSVersion",
      "reference/type-aliases/PSDByChannel",
      "reference/type-aliases/UserDevice",
      "reference/type-aliases/UserDevices"
    ]
  }
};

export default sidebars;
