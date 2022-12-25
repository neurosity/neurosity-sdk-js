---
id: kinesis
title: Kinesis
---

The [Kinesis API](/docs/reference/interfaces/kinesis) is based on the Motor Imagery BCI method. Fires when a user attempts to trigger a side effect from defined thoughts. E.g. motor imagery, etc.

Kinesis implements a spike detection algorithm over the [predictions](/docs/api/predictions) observable.

To train a Kinesis command, use [console.neurosity.co](https://console.neurosity.co/) and use the corresponding label for the `Active` classifier. Learn how to train a new command [here](https://support.neurosity.co/hc/en-us/articles/360036344012-Imagined-thought-training). To make your own custom training, see [guides/training](/docs/guides/training).

```js
const neurosity = new Neurosity();

neurosity.kinesis("rightArm").subscribe((intent) => {
  // Switch light off/on
  light.togglePower();
  console.log(intent);
});

// { probability: 0.93, label: "rightArm", timestamp: 1569961321174, metric: "kinesis" }
```

or

```js
neurosity.kinesis("leftArm").subscribe((intent) => {
  // Launch drone
  drone.launch();
  console.log(intent);
});

// { probability: 0.92, label: "leftArm", timestamp: 1569961321191, type: "kinesis"  }
```
