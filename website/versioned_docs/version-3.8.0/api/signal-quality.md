---
id: version-3.8.0-signal-quality
title: Signal Quality
original_id: signal-quality
---
Impedance based signal quality metrics.

```js
import { Notion } from "@neurosity/notion";

const notion = new Notion();

notion.signalQuality().subscribe(signalQuality => {
  console.log(signalQuality);
});
```
