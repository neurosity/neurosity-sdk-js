---
id: predictions
title: Predictions
---

The predictions API is based on the Motor Imagery BCI method. Predictions are produced a predetermined amount of times per second. If you're looking to implement your own Kinesis algorithim, then predictions can be good for you.

To train to produce predictions, use [console.neurosity.co](https://console.neurosity.co/) and use the corresponding label for the `Active` classifier. Learn how to train a new command [here](https://support.neurosity.co/hc/en-us/articles/360036344012-Imagined-thought-training).

```js
const neurosity = new Neurosity();

neurosity.predictions("leftArm").subscribe((prediction) => {
  console.log("prediction", prediction);
});

// { probability: 0.93, label: "leftArm", timestamp: 1569961321174, metric: "kinesis" }
```
