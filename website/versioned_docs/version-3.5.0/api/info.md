---
id: version-3.5.0-info
title: Device Information
original_id: info
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

```js
import { Notion } from "@neurosity/notion";

const notion = new Notion();

const info = await notion.getInfo();
console.log(info); // { channels: 8, samplingRate: 250, ... }
```
