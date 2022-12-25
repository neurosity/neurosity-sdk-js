---
id: disconnect
title: Disconnect
---

You should always call disconnect the Neurosity instance when you're ending a session. This will clean up the session.

```js
import { Neurosity } from "@neurosity/sdk";

const neurosity = new Neurosity();

neurosity.disconnect();
```
