---
id: kinesis
title: Kinesis
---

The Kinesis API is based on the Motor Imagery BCI method. Fires when a user attempts to trigger a side effect from defined thoughts. E.g. motor imagery, etc.

To train a Kinesis command, use [console.neurosity.co](console.neurosity.co) and use the corresponding label for the `Active` classifier. Learn how to train a new command [here](https://support.neurosity.co/hc/en-us/articles/360036344012-Imagined-thought-training).

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
