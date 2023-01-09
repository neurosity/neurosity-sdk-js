---
id: bluetooth-web
title: Bluetooth for Web
---

> :warning: **Requires**: Neurosity OS v16+, to be released in January 2023

Not all browsers support Web Bluetooth. You can refer to browser-specific support [here](https://caniuse.com/web-bluetooth).

Additionally, there are some Browser Bluetooth flags that need to be enabled:

<p align="center">
  <img alt="Browser Feature Flags" src="/img/api/web-bluetooth-browser-flags.png" />
</p>

[chrome://flags/#enable-experimental-web-platform-features](chrome://flags/#enable-experimental-web-platform-features)

Before

```jsx
import { Neurosity } from "@neurosity/sdk";

export const neurosity = new Neurosity({
  autoSelectDevice: true
});
```

After

```ts {1,5-6}
import { Neurosity, WebBluetoothTransport } from "@neurosity/sdk";

export const neurosity = new Neurosity({
  autoSelectDevice: true,
  bluetoothTransport: new WebBluetoothTransport(),
  streamingMode: "bluetooth-with-wifi-fallback"
});
```

When using Bluetooth, there are 2 streaming modes you can choose from:

- `wifi-with-bluetooth-fallback`
- `bluetooth-with-wifi-fallback`

## Bluetooth Connection State

```ts
const { bluetooth } = neurosity;

bluetooth.connection().subscribe((connection) => {
  console.log(`Bluetooth connected is ${connection}`);
});
```

The following connection states are possible:

```ts
enum BLUETOOTH_CONNECTION {
  SCANNING = "scanning",
  CONNECTED = "connected",
  CONNECTING = "connecting",
  DISCONNECTING = "disconnecting",
  DISCONNECTED = "disconnected"
}
```

## Auto Connect

By default, the Web Bluetooth transport will attempt to auto connect to the [selected device](/docs/api/device-selection). To disable this behavior, set the `autoConnect` transport option to `false`:

```ts
import { Neurosity, WebBluetoothTransport } from "@neurosity/sdk";

export const neurosity = new Neurosity({
  autoSelectDevice: true,
  bluetoothTransport: new WebBluetoothTransport({
    autoConnect: false
  }),
  streamingMode: "bluetooth-with-wifi-fallback"
});
```

It is also possible to enable or disable this behavior at runtime:

```ts
const { bluetooth } = neurosity;

bluetooth.enableAutoConnect(true);

// or

bluetooth.enableAutoConnect(false);
```
