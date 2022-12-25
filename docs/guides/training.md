---
id: training
title: Training
---

We recommend learning about an [imagined thought training here](https://support.neurosity.co/hc/en-us/articles/360036344012-Imagined-thought-training) before starting this guide.

Training builds a model between two thoughts. That's the basis of thought recognition. We start by looking at the difference between an active state and a rest state.

To train a thought, you need to timesync and you need to call a special api endpoint.

### Time Synchronization

```js
const { Neurosity } = require("@neurosity/sdk");

const neurosity = new Neurosity({
  timesync: true
});

main();

async function main() {
  await neurosity.login({
    email: process.env.NEUROSITY_EMAIL,
    password: process.env.NEUROSITY_PASSWORD
  });
  .catch(error => {
    console.log("error", error);
  });
  // logged in!
}
```

The most important feature is the fact that I have `timesync: true` in the options argument to instantiate a new `Neurosity`.

```js
const neurosity = new Neurosity({
  timesync: true
});
```

Other than than, I'm retrieving my `email`, and `password` from my `.env` file. Learn about `.env` files in [this awesome artical](https://medium.com/the-node-js-collection/making-your-node-js-work-everywhere-with-environment-variables-2da8cdf6e786) by [John Papa](https://twitter.com/John_Papa).

### Tagging

Let's say we want to train the left arm versus a baseline class. You're going to show the user a video in VR of them throwing a baseball.

We could add to our main function something like.

```js
const metric = "kinesis";
const label = "leftArm";

const trainingOptions = {
  metric,
  label,
  experimentId: "-experiment-123"
};

// Subscribe to Kinesis
neurosity.kinesis(label).subscribe((kinesis) => {
  console.log("leftArm kinesis detection", kinesis);
});

// Subscribe to raw predictions
neurosity.predictions(label).subscribe((prediction) => {
  console.log("leftArm prediction", prediction);
});

// Tell the user to clear their mind
console.log("Clear you mind and relax");

// Tag baseline after a couple seconds
setTimeout(() => {
  // Note: using the spread operator to bring all properties from trainingOptions into the current object plus adding the new baseline tag. Learn about spread operators here: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax
  neurosity.training.record({
    ...trainingOptions,
    baseline: true
  });

  // Now tell the user to imagine an active thought
  console.log("Imagine a baseball with your left arm");
}, 4000);

// Tell the user to imagine active thought and fit
setTimeout(() => {
  // Note: You must call fit after a baseline and an active have been recorded.
  neurosity.training.record({
    ...trainingOptions,
    fit: true
  });
}, 8000);
```

Now this new thought has been trained and can be used. To make the thought more accurate, ensure good signal quality and add more trainings by calling record more times.

If you call `fit` too fast, there is potential to max out the CPU, if this happens, [submit an issue](https://support.neurosity.co/hc/en-us/requests/new) and call fit less frequently.
