---
id: device-selection
title: Device Selection
---

When using the Neurosity SDK, there are 3 ways to select which device you wish to connect to. The options are:

- Automatic Device Selection (recommended)
- Ahead Of Time Device Selection
- Manual Device Selection

### Automatic Device Selection

The easiest way to communicate with your device is via automatic device selection. This method is the best if you only own 1 device. Simply instantiate the `Neurosity` class and it will automatically fetch your claimed device and select it. That's it.

```js
import { Neurosity } from "@neurosity/sdk";

const neurosity = new Neurosity();
```

### Ahead Of Time Device Selection

This method is especially useful if you have your Device ID available. Simply pass it as an option when instantiating the `Neurosity` class.

```js
import { Neurosity } from "@neurosity/sdk";

const neurosity = new Neurosity({
  deviceId: "..."
});
```

### Manual Device Selection

Selecting a device manually is the way to go when the user owns multiple devices. It's also the recommended approach when building Neurosity apps for other people to use.

A common use case for manually selecting a device is when you wish to build a device dropdown a user can select from, instead of collecting the `Device ID` from the user ahead of time.

The 3 steps to manually selecting a device are:

- Set `autoSelectDevice` to `false` when instantiating the `Neurosity` class.
- Authenticate with your Neurosity account to access your devices by calling the `neurosity.login(...)` function.
- Call the `neurosity.selectDevice(...)` function with a device selector function or field/value combination.

```js
import { Neurosity } from "@neurosity/sdk";

(async function main() {
  const neurosity = new Neurosity({
    autoSelectDevice: false
  });

  await neurosity.login({
    email: "...",
    password: "..."
  });

  // select via field/value
  await neurosity.selectDevice(["deviceNickname", "Crown-A1B"]);

  // or select via selector function
  await neurosity.selectDevice((devices) =>
    devices.find((device) => device.deviceNickname === "Crown-A1B")
  );
})();
```

The devices list contains all claimed devices by the Neurosity account the user is authenticated with. The shape of each device is called `DeviceInfo`, and it contains the following attributes:

```ts
type DeviceInfo = {
  apiVersion: string;
  channelNames: string[];
  channels: number;
  deviceId: string;
  deviceNickname: string;
  manufacturer: string;
  model: string;
  modelName: string;
  modelVersion: string;
  osVersion: string;
  samplingRate: number;
};
```

You can select a device based on any attribute. For example, you could select a device based on the `model`. The following example selects the earliest claimed Notion 2 device.

```js
import { Neurosity } from "@neurosity/sdk";

(async function main() {
  const neurosity = new Neurosity({
    autoSelectDevice: false
  });

  await neurosity.login({
    email: "...",
    password: "..."
  });

  await neurosity.selectDevice((devices) =>
    devices.find((device) => device.model === "Notion 2")
  );
})();
```

#### Accessing the list of devices

```js
import { Neurosity } from "@neurosity/sdk";

(async function main() {
  const neurosity = new Neurosity({
    autoSelectDevice: false
  });

  await neurosity.login({
    email: "...",
    password: "..."
  });

  // Devices are ordered by `claimedOn` date asc
  const devices = await neurosity.getDevices();
})();
```

#### Accessing selected device

```js
import { Neurosity } from "@neurosity/sdk";

(async function main() {
  const neurosity = new Neurosity({
    autoSelectDevice: false
  });

  await neurosity.login({
    email: "...",
    password: "..."
  });

  // Access device when selecting
  const selectedDevice = await neurosity.selectDevice((devices) =>
    devices.find((device) => device.deviceNickname === "Crown-B1C")
  );

  // Or every time the device selection changes
  const selectedDevice = neurosity
    .onDeviceChange()
    .subscribe((selectedDevice) => {
      console.log(selectedDevice);
    });
})();
```

> If you own multiple devices, and don't set `autoSelectDevice` to false, then the earliest claimed device on the list will be automatically selected.

### Switching devices

Selecting a device can only be done once. For switching between devices, simply:

- Disconnect the current Neurosity instance by calling `neurosity.disconnect()`
- Create a new `Neurosity` instance.
