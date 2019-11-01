---
id: calm
title: Calm
---

Constantly fires and predicts user's calm level from passive cognitive state.

```js
const mind = new Notion();

mind.calm().subscribe(calm => {
  console.log(calm);
});

// { probability: 0.34, metric: "awareness", label: "calm", timestamp:  1569961321101 }
// { probability: 0.41, metric: "awareness", label: "calm", timestamp:  1569961321105 }
// { probability: 0.45, metric: "awareness", label: "calm", timestamp:  1569961321110 }

// Demo
mind.calm().subscribe(({ probability }) => {
  if (probability < 0.25) {
    musicPlayer.recommendGenre("classical");
  }
});
```
