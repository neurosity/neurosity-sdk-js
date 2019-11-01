---
id: status
title: Device Status
---

## Metrics:

- battery: Number
- connected: Boolean
- powered: Boolean
- updating: Boolean

```js
import { Notion } from "@neurosity/notion";

const notion = new Notion();

notion.status().subscribe(status => {
  console.log(status); // status example: { connected: true, powered: true, ... }
});
```
