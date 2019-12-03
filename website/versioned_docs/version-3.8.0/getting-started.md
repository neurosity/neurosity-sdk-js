---
id: version-3.8.0-getting-started
title: Getting Started
original_id: getting-started
---

## Installing

```bash
npm install @neurosity/notion
```

## Importing

Then import the module

### ESM

```js
import { Notion } from "@neurosity/notion";
```

### Node

```js
const { Notion } = require("@neurosity/notion");
```

### Browser

```html
<script type="module">
  import { Notion } from "./node_modules/notion/esm/notion.mjs";
</script>
<script nomodule src="./node_modules/notion/browser/notion.js">
```

## Using

You'll want to [learn how to authenticate](/docs/api/authentication) with Notion next using your [console.neurosity.co](console.neurosity.co) login.
