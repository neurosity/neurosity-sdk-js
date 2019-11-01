---
id: authentication
title: Authentication
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
