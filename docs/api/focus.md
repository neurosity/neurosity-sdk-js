---
id: focus
title: Focus
---

Constantly fires and predicts user's focus level from passive cognitive state.

```js
const mind = new Notion();

mind.focus().subscribe(focus => {
  console.log(focus);
});

// { probability: 0.51, metric: "awareness", label: "focus", timestamp:  1569961321102 }
// { probability: 0.56, metric: "awareness", label: "focus", timestamp:  1569961321106 }
// { probability: 0.62, metric: "awareness", label: "focus", timestamp:  1569961321111 }

// Demo
mind.focus().subscribe(({ probability }) => {
  if (probability > 0.75) {
    notifications.off();
  }
});
```
