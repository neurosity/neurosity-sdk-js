---
id: disconnect
title: Disconnect
---

You should always call disconnect from the Notion when you're ending a session with Notion. This will clean up the session.

```js
import { Notion } from "@neurosity/notion";

const notion = new Notion();

notion.disconnect();
```
