---
id: settings
title: Device Settings
---
Settings are options that can be changed at run time. The only settings as of now are enabling and disabling LSL. To request more settings, head over to the [online community](https://support.neurosity.co/hc/en-us/community/topics).

An example of using NotionJS to query and then toggle  device settings:

```js
import { Notion } from "@neurosity/notion";

const notion = new Notion();

notion.settings().subscribe(settings => {
  console.log(settings);
  // { lsl: false }
  // { lsl: true }
});

await notion.changeSettings({
  lsl: true
});
```
