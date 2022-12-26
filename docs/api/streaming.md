---
id: streaming
title: Wi-Fi & Bluetooth
---

By default, the Neurosity SDK uses Wi-Fi and the cloud. This means that all the metrics streaming by the Crown will go through the secured Neurosity servers.

As of Neurosity OS v16, there is the option to use Bluetooth as a streaming transport. Currently, Bluetooth support is available for Web and React Native environments. We are planning to add Bluetooth support to Node next.

### Wi-Fi and Bluetooth comparison table

|                                                       | Wi-Fi | Bluetooth |
| ----------------------------------------------------- | ----- | --------- |
| Metrics Streaming                                     | ✅    | ✅        |
| Automatic Device Connection                           | ✅    | ✅        |
| Crown can be used without internet                    | 🚫    | ✅        |
| SDK can be run at a different location from the Crown | ✅    | 🚫        |
| Device Settings (read/write)                          | ✅    | 🚫        |
| All browsers support                                  | ✅    | 🚫        |
| NodeJS support                                        | ✅    | 🚫        |
| Electron support                                      | ✅    | 🚫        |

When building your app, there are 3 streaming strategies you can choose from:

- `wifi-only` (default)
- `wifi-with-bluetooth-fallback`
- `bluetooth-with-wifi-fallback`

Neurosity's recommendation is to start your app with `wifi-only` streaming and add Bluetooth later as needed.

Start building:

- [Bluetooth for Web tutorial](/docs/api/bluetooth-web)
- [Bluetooth for React Native tutorial](/docs/api/bluetooth-react-native)
