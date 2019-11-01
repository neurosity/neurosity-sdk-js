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
import { Notion } from "@neurosity/notion";

const notion = new Notion();

notion.settings().subscribe(settings => {
  console.log(settings);
  // { lsl: false }
  // { lsl: true }
});

await notion.changeSettings({
  lsl: true
});
```
