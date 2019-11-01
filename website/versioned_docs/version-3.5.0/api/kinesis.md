---
id: version-3.5.0-kinesis
title: Kinesis
original_id: kinesis
---

The Kinesis API is based on the Motor Imagery BCI method. Fires when a user attempts to trigger a side effect from defined thoughts. E.g. motor imagery, etc.

```js
const mind = new Notion();

mind.kinesis("rightHand").subscribe(intent => {
  // Switch light off/on
  light.togglePower();
  console.log(intent);
});

// { probability: 0.93, label: "rightHand", timestamp: 1569961321174, metric: "kinesis"

mind.kinesis("liftHand").subscribe(intent => {
  // Launch drone
  drone.launch();
  console.log(intent);
});

// { probability: 0.92, label: "liftHand", timestamp: 1569961321191, type: "kinesis"  }
```
