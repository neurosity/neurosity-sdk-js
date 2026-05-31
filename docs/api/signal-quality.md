---
id: signal-quality
title: Signal Quality
---

## Signal Quality (v1)

Standard deviation based signal quality metrics. Great signal happens when the standard deviation is between 1.5 and 10. See [`SignalQuality`](https://docs.neurosity.co/docs/reference/interfaces/signalquality) for using in code.

```js
import { Neurosity } from "@neurosity/sdk";

const neurosity = new Neurosity();

neurosity.signalQuality().subscribe((signalQuality) => {
  console.log(signalQuality);
});

// { CP3: { standardDeviation: 3.5, status: "great" }, C3: { ... }, ... }
```

## Signal Quality V2

Normalized signal quality scores (0-1) with per-channel and overall metrics. Scores above 0.75 indicate adequate signal quality.

```js
neurosity.signalQualityV2().subscribe((quality) => {
  // Overall score across all channels
  console.log(quality.overall.score); // 0.85

  // Per-channel scores
  Object.entries(quality.byChannel).forEach(([channel, data]) => {
    console.log(`${channel}: ${data.score.toFixed(2)}`);
  });
});

// Example output:
// overall: 0.85
// CP3: 0.92
// C3: 0.88
// F5: 0.71
// PO3: 0.90
// ...
```

### SignalQualityV2 Type

```typescript
interface SignalQualityV2 {
  timestamp: number;
  overall: {
    score: number; // 0-1 normalized
  };
  byChannel: {
    [channelName: string]: {
      score: number; // 0-1 normalized
    };
  };
}
```
