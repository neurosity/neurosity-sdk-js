---
id: streaming
title: Wi-Fi & Bluetooth
---

By default, the Neurosity SDK uses Wi-Fi and the cloud. This means that all the metrics streaming by the Crown will go through the secured Neurosity servers.

As of Neurosity OS v16, there is the option to use Bluetooth as a streaming transport. Currently, Bluetooth support is available for Web and React Native environments. We are planning to add Bluetooth support to Node next.

## Comparison table

|                                        | Wi-Fi | Bluetooth |
| -------------------------------------- | ----- | --------- |
| Metrics streaming                      | ✅    | ✅        |
| Secure & private (encryption & auth)   | ✅    | ✅        |
| Automatic device connection            | ✅    | ✅        |
| Crown can be used without internet     | 🚫    | ✅        |
| Crown can be located far away from app | ✅    | 🚫        |
| Kinesis                                | ✅    | 🚫        |
| Device settings (read/write)           | ✅    | 🚫        |
| Support all browsers                   | ✅    | 🚫        |
| NodeJS support                         | ✅    | 🚫        |
| Electron support                       | ✅    | 🚫        |

When building your app, there are 3 streaming strategies you can choose from:

- `wifi-only` (default)
- `wifi-with-bluetooth-fallback`
- `bluetooth-with-wifi-fallback`

Neurosity's recommendation is to start your app with `wifi-only` streaming and add Bluetooth later as needed.

## Streaming State

Starting with v6, it is possible to subscribe to real-time streaming state changes. For example, if you chose `wifi-with-bluetooth-fallback`, you could do:

```ts
import { Neurosity, WebBluetoothTransport } from "@neurosity/sdk";

const neurosity = new Neurosity({
  bluetoothTransport: new WebBluetoothTransport(),
  streamingMode: "wifi-with-bluetooth-fallback"
});

neurosity.streamingState().subscribe((streamingState) => {
  console.log(streamingState);
});

// { streamingMode: "wifi-with-bluetooth-fallback", activeMode: "wifi", connected: true }
// If wifi went offline, the subscribe callback would fire again with:
// { streamingMode: "wifi-with-bluetooth-fallback", activeMode: "bluetooth", connected: true }
```

The same way, if you chose `bluetooth-with-wifi-fallback`:

```ts
import { Neurosity, WebBluetoothTransport } from "@neurosity/sdk";

const neurosity = new Neurosity({
  bluetoothTransport: new WebBluetoothTransport(),
  streamingMode: "bluetooth-with-wifi-fallback"
});

neurosity.streamingState().subscribe((streamingState) => {
  console.log(streamingState);
});

// { streamingMode: "bluetooth-with-wifi-fallback", activeMode: "bluetooth", connected: true }
// If bluetooth went out of proximity range, the subscribe callback would fire again with:
// { streamingMode: "bluetooth-with-wifi-fallback", activeMode: "wifi", connected: true }
```

## Start building

- [Bluetooth for Web tutorial](/docs/api/bluetooth-web)
- [Bluetooth for React Native tutorial](/docs/api/bluetooth-react-native)
