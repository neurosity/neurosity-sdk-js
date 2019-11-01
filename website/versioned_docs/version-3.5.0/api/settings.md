---
id: version-3.5.0-settings
title: Device Settings
original_id: settings
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
