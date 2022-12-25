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
import { Neurosity } from "@neurosity/sdk";

const neurosity = new Neurosity();

neurosity.status().subscribe((status) => {
  console.log(status);
  // status example: { state: "online", charging: true, battery: 93, ... }
});
```
