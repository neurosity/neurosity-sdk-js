---
id: device-selection
title: Device Selection
---

When using the Notion API, there are 3 ways to select which device you wish to connect to. The options are:

- Automatic Device Selection (recommended)
- Ahead Of Time Device Selection
- Manual Device Selection

### Automatic Device Selection

The easiest way to communicate with your device is via automatic device selection. This method is the best if you only own 1 device. Simply instantiate `Notion` and it will automatically fetch your claimed device and select it. That's it.

```js
import { Notion } from "@neurosity/notion";

const notion = new Notion();
```

### Ahead Of Time Device Selection

This method is especially useful if you have your Device ID on had. Simply pass it as an option when instantiating `Notion`.

```js
import { Notion } from "@neurosity/notion";

const notion = new Notion({
  deviceId: "..."
});
```

### Manual Device Selection

Selecting a device manually is the way to go when the user owns multiple devices.

A common use case for manually selecting a device is when you wish to build a device dropdown a user can select from, instead of collecting the `Device ID` from the user ahead of time.

The 3 steps to manually selecting a device are:

- Set `autoSelectDevice` to false when instantiating `Notion`.
- Authenticate with your Neurosity account to access your devices by calling the `notion.login(...)` function.
- Call the `notion.selectDevice(...)` function with a device selector function.

```js
import { Notion } from "@neurosity/notion";

(async function main() {
  const notion = new Notion({
    autoSelectDevice: false
  });

  await notion.login({
    email: "...",
    password: "..."
  });

  await notion.selectDevice((devices) =>
    devices.find((device) => device.deviceNickname === "Notion-A1B")
  );
})();
```

The devices list contains all claimed devices by the user account Notion is authenticated with. The shape of `DeviceInfo` is:

```ts
type DeviceInfo = {
  apiVersion: string;
  channelNames: string[];
  channels: number;
  deviceId: string;
  deviceNickname: string;
  manufacturer: string;
  modelName: string;
  osVersion: string;
  samplingRate: number;
};
```

You can select a device based on any attribute. For example, you could select a device based on the `osVersion`.

```js
import { Notion } from "@neurosity/notion";

(async function main() {
  const notion = new Notion({
    autoSelectDevice: false
  });

  await notion.login({
    email: "...",
    password: "..."
  });

  await notion.selectDevice((devices) =>
    devices.find((device) => device.osVersion === "14.0.0")
  );
})();
```

#### Accessing the list of devices

```js
import { Notion } from "@neurosity/notion";

(async function main() {
  const notion = new Notion({
    autoSelectDevice: false
  });

  await notion.login({
    email: "...",
    password: "..."
  });

  const devices = await notion.getDevices();
})();
```

#### Accessing selected device

```js
import { Notion } from "@neurosity/notion";

(async function main() {
  const notion = new Notion({
    autoSelectDevice: false
  });

  await notion.login({
    email: "...",
    password: "..."
  });

  const selectedDevice = await notion.selectDevice((devices) =>
    devices.find((device) => device.deviceNickname === "Notion-B1C")
  );

  // Or later...

  const deviceInfo = await notion.getInfo();
})();
```

> If you own multiple devices, and don't set `autoSelectDevice` to false, then the first device on the list will be automatically selected.

### Switching devices

Selecting a device can only be done once. For switching between devices, simply:

- Disconnect the current Notion by calling `notion.disconnect()`
- Create a new `Notion` instance.
