---
id: version-3.5.0-authentication
title: Authentication
original_id: authentication
---

```js
import { Notion } from "@neurosity/notion";

main();

async function main() {
  const notion = new Notion();

  await notion.login({
    email: "*****",
    password: "*****"
  });

  // logged in!
}
```
