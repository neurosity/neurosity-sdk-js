---
id: version-3.8.0-channel-analysis
title: Channel Analysis
original_id: channel-analysis
---

An alternative to impedance measuring.

```js
import { Notion } from "@neurosity/notion";

const notion = new Notion();

notion.channelAnalysis().subscribe(channelAnalysis => {
  console.log(channelAnalysis); // channel analysis: { FC1: 1, FC2: 0, FC3: -1, FC4: 1, ... }
});
```
