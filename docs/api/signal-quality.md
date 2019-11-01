---
id: signal-quality
title: Signal Quality
---

```js
import { Notion } from "@neurosity/notion";

const notion = new Notion();

notion.signalQuality().subscribe(signalQuality => {
  console.log(signalQuality);
});
```
