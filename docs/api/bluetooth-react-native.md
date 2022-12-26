---
id: bluetooth-react-native
title: Bluetooth for React Native
---

> :warning: **Requires**: Neurosity OS v16+

Adding the Bluetooth transport for React Native requires the [`react-native-ble-manager`](https://github.com/innoveit/react-native-ble-manager/) library. Install the library and set up the permission as per their documentation before moving to the next step.

Before

```jsx
import { Notion, WebBluetoothTransport } from "@neurosity/sdk";

export const neurosity = new Notion({
  autoSelectDevice: true
});
```

After

```ts {1-3,7-12}
import { Neurosity, ReactNativeTransport } from "@neurosity/sdk";
import { NativeModules, NativeEventEmitter, Platform } from "react-native";
import BleManager from "react-native-ble-manager";

export const neurosity = new Neurosity({
  autoSelectDevice: true,
  bluetoothTransport: new ReactNativeTransport({
    BleManager,
    bleManagerEmitter: new NativeEventEmitter(NativeModules.BleManager),
    platform: Platform.OS
  }),
  streamingMode: "bluetooth-with-wifi-fallback"
});
```

When using Bluetooth, there are 2 streaming modes you can choose from:

- `wifi-with-bluetooth-fallback`
- `bluetooth-with-wifi-fallback`
