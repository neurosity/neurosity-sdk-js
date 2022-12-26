---
id: bluetooth-web
title: Bluetooth for Web
---

> :warning: **Requires**: Neurosity OS v16+

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
