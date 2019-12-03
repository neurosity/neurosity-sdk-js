---
id: version-3.8.0-predictions
title: Predictions
original_id: predictions
---

The predictions API is based on the Motor Imagery BCI method. Predictions are produced a predetermined amount of times per second. If you're looking to implement your own Kinesis algorithim, then predictions can be good for you.

To train to produce predictions, use [console.neurosity.co](console.neurosity.co) and use the corresponding label for the `Active` classifier. Learn how to train a new command [here](https://support.neurosity.co/hc/en-us/articles/360036344012-Imagined-thought-training).

```js
const mind = new Notion();

notion
  .predictions("leftArm")
  .subscribe(prediction => {
      console.log("prediction", prediction);
  });

// { probability: 0.93, label: "leftArm", timestamp: 1569961321174, metric: "kinesis" }
```