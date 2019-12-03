---
id: version-3.8.0-status
title: Device Status
original_id: status
---

## Metrics:

- battery: Number
- charging: Boolean
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
