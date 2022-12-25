---
id: signal-quality
title: Signal Quality
---

Standard deviation based signal quality metrics. Great signal happens when the standard deviation is between 1.5 and 10. See [`SignalQuality`](https://docs.neurosity.co/docs/reference/interfaces/signalquality) for using in code.

```js
import { Neurosity } from "@neurosity/sdk";

const neurosity = new Neurosity();

neurosity.signalQuality().subscribe((signalQuality) => {
  console.log(signalQuality);
});
```
