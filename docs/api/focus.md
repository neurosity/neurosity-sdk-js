---
id: focus
title: Focus
---

Constantly fires and predicts user's focus level from passive cognitive state based on the gamma brainwave between `30Hz` and `44Hz`. Focus is a probability from `0.0` to `1.0`. To get focus over `0.3` is significant. Focus will take up to 16 seconds to fully initialize.

```js
import { Neurosity } from "@neurosity/sdk";

const neurosity = new Neurosity();

neurosity.focus().subscribe((focus) => {
  console.log(focus);
});

// { probability: 0.51, metric: "awareness", label: "focus", timestamp:  1569961321102 }
// { probability: 0.56, metric: "awareness", label: "focus", timestamp:  1569961321106 }
// { probability: 0.62, metric: "awareness", label: "focus", timestamp:  1569961321111 }

// Demo
neurosity.focus().subscribe(({ probability }) => {
  if (probability > 0.5) {
    notifications.off();
  }
});
```
