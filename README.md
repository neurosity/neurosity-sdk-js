# Notion Client API by Neurosity

- Universal JavaScript support: Node/Browser/Electron
- Firebase + Custom Metric Subscriber
- Event-driven multi-client real-time architecture

> This is a private (soon to be public) module published on npm. Ensure the npm user has access to the neurosity npm org before installing/publishing.

## Getting started

```bash
npm install @neurosity/notion
```

Then import the module

##### ESM

```js
import { Notion } from "@neurosity/notion";
```

##### Node

```js
const { Notion } = require("@neurosity/notion");
```

##### Browser

```html
<script type="module">
  import { Notion } from "./node_modules/notion/esm/notion.mjs";
</script>
<script nomodule src="./node_modules/notion/browser/notion.js">
```

## Examples

### Basic

Utilizes Firebase client for data transport.

```js
const notion = new Notion({
  deviceId: "****",
  apiKey: "************"
});
```

Options:

```ts
interface IOptions {
  deviceId: string;
  apiKey?: string;
  metricsAllowed?: string[];
  websocket: IWebsocketClient;
}
```

### Clients

Supported clients include

- Firebase
- (Custom Subscriber e.i. Websocket instance)

Clients should be classes with the following interface.

```ts
export interface IClient {
  actions: IActions;
  connect(callback?: Function): Promise<any>;
  disconnect(callback?: Function): Promise<any>;
  getInfo(): Promise<any>;
  metrics: IMetrics;
}
```

## Skills

Skills are applications that can be written and deployed to a Notion device.

A Skill is an npm package with:

- index.js
- package.json

For example:

./index.js

```js
import { createSkill } from "@neurosity/notion";
import { Drone } from "parrot-drone";

export const mySkill = createSkill((notion, context) => {
  const { credentials } = context;

  const drone = new Drone({
    credentials
  });

  notion.kinesis().subscribe(kinesis => {
    drone.setFlightParams(kinesis);
  });
});
```

./package.json

```json
{
  "name": "mind-drone",
  "version": "1.0.0",
  "description": "Notion-powered drone control",
  "dependencies": {
    "@neurosity/notion": "^6.0.0",
    "parrot-drone": "*"
  },
  "engines": {
    "node": "10"
  },
  "private": true
}
```

## Releases

Please use [semver](https://docs.npmjs.com/misc/semver)

```
$ npm version (major|minor|patch)
$ npm push origin master
$ npm publish
```

## Examples

Requirements to run examples:

- Create `.env` file in root directory
- Add: DEVICE_ID=YOUR_DEVICE_ID

### Browser

Builds browser examples and serves examples in the browser with ES modules.

```bash
npm run examples:browser
```

Go to: [http://localhost:3000](http://localhost:3000)

### Node

```bash
npm run examples:node
```

## TODOs

- Add error handling
- Test Auth
- Check for CORS
- Security audit
- Document how to get `deviceId`
- Document how to get `apiKey` for firebase
- Remove `apiKey` from examples
- Publish to cdn
