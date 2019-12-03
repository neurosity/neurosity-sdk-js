---
id: version-3.8.0-training
title: Training
original_id: training
---

Options

```ts
interface ITraining {
  metric: string;
  label: string;
  duration: Date; // milliseconds
  fit?: boolean = false;
  timestamp?: Date;
}
```

Example

```js
const mind = new Notion();

mind.training.record({
  metric: "kinesis",
  label: "rightHand",
  duration: 5000
});
```