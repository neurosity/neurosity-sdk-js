---
id: importing
title: Importing
---

We support ESM, Node and the Browser:

## ESM

```js
import { Neurosity } from "@neurosity/sdk";
```

## Node

```js
const { Neurosity } = require("@neurosity/sdk");
```

## Browser

```html
<script type="module">
  import { Neurosity } from "./node_modules/@neurosity/sdk/index.mjs";
</script>
<script nomodule src="./node_modules/@neurosity/sdk/neurosity.umd.js">
```
