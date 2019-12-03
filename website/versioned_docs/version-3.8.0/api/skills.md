---
id: version-3.8.0-skills
title: Skills
original_id: skills
---
Skills are applications that can be written and deployed to a Notion device. **Skill support will be added ASAP**

A Skill is an npm package with:

- index.js
- package.json

For example:

./index.js

```js
const { createSkill } = require("@neurosity/notion");

module.exports = createSkill((notion, context) => {
  notion.kinesis().subscribe(kinesis => {
    console.log(kinesis);
  });

  return async () => {
    // Any additional clean-up here
  };
});
```

Note the Skill has to be exported as default.

./package.json

```json
{
  "name": "mind-drone",
  "version": "1.0.0",
  "description": "Notion-powered drone control",
  "dependencies": {
    "@neurosity/notion": "^1.0.0"
  },
  "engines": {
    "node": "10"
  },
  "private": true
}
```