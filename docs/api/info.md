---
id: info
title: Device Information
---

Non-mutable device information.

## Metrics:

```js
interface IInfo {
  deviceId: string;
  channels: number;
  channelNames: Array<string>;
  samplingRate: number;
  manufacturer: string;
  model: string;
  osVersion: string;
  apiVersion: string;
}
```

## Example

```js
import { Neurosity } from "@neurosity/sdk";

const neurosity = new Neurosity();

const info = await neurosity.getInfo();
console.log(info); // { channels: 8, samplingRate: 250, ... }
```
