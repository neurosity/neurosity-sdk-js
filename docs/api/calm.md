---
id: calm
title: Calm
---

Constantly fires and predicts user's calm level from passive cognitive state based on the alpha brainwave between `7.5Hz` and `12.5Hz`. Calm is a probability from `0.0` to `1.0`. To get calm over `0.3` is significant. Calm will take up to 16 seconds to initialize. We normally take a longer rolling average of calm to produce brain processes over time, see how we do it in our [flow walk through](https://support.neurosity.co/hc/en-us/articles/360036343372-Flow-state).

Things that can help increase the calm score are:

- Closing your eyes for 30 seconds or more
- Seating or standing still
- Breathing exercises
- Meditating

```js
import { Neurosity } from "@neurosity/sdk";

const neurosity = new Neurosity();

neurosity.calm().subscribe((calm) => {
  console.log(calm);
});

// { probability: 0.34, metric: "awareness", label: "calm", timestamp:  1569961321101 }
// { probability: 0.41, metric: "awareness", label: "calm", timestamp:  1569961321105 }
// { probability: 0.45, metric: "awareness", label: "calm", timestamp:  1569961321110 }

// Demo
neurosity.calm().subscribe(({ probability }) => {
  if (probability < 0.25) {
    musicPlayer.recommendGenre("classical");
  }
});
```
