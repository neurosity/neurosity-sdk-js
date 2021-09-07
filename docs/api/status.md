---
id: status
title: Device Status
---

## Metrics:

- state: "online" | "offline" | "shuttingOff" | "updating" | "booting"
- sleepMode: boolean
- sleepModeReason: "updating" | "charging" | null
- charging: boolean
- battery: number
- lastHeartbeat: number
- ssid: string
- claimedBy: string

```js
import { Notion } from "@neurosity/notion";

const notion = new Notion();

notion.status().subscribe((status) => {
  console.log(status);
  // status example: { state: "online", charging: true, battery: 93, ... }
});
```
