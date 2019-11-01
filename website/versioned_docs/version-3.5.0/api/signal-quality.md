---
id: version-3.5.0-signal-quality
title: Signal Quality
original_id: signal-quality
---

```js
import { Notion } from "@neurosity/notion";

const notion = new Notion();

notion.signalQuality().subscribe(signalQuality => {
  console.log(signalQuality);
});
```
