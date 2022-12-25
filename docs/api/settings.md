---
id: settings
title: Device Settings
---

## Methods:

```
- settings(): => Observable<Settings>
- changeSettings(settings: ChangeSettings): Promise<void>
```

```js
import { Neurosity } from "@neurosity/sdk";

const neurosity = new Neurosity();

neurosity.settings().subscribe((settings) => {
  console.log(settings);
  // { lsl: false }
  // { lsl: true }
});

await neurosity.changeSettings({
  lsl: true
});
```
