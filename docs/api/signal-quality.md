---
id: signal-quality
title: Signal Quality
---
Standard deviation based signal quality metrics. See [`SignalQuality`](https://docs.neurosity.co/docs/reference/interfaces/signalquality) for using in code.

```js
import { Notion } from "@neurosity/notion";

const notion = new Notion();

notion.signalQuality().subscribe(signalQuality => {
  console.log(signalQuality);
});
```
