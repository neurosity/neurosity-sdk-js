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
  deviceId: "****"
});
```

Options:

```ts
interface IOptions {
  deviceId: string;
}
```

## Metrics

- Calm
- Focus
- Kinesis
- Device
  - Status
  - Info
- Channel Aalysis
- Training
- Brainwaves
  - Raw
  - Frequency
  - PSD

### Basic examples

```js
import { Notion } from "@neurosity/notion";

const notion = new Notion();
```

##### Methods

- connect()
- disconnect()
- async getInfo()

#### Calm

Constantly fires and predicts user's calm level from passive cognitive state.

```js
const mind = new Notion();

mind.calm().subscribe(calm => {
  console.log(calm);
});

// { probability: 0.34, metric: "awareness", label: "calm", timestamp:  1569961321101 }
// { probability: 0.41, metric: "awareness", label: "calm", timestamp:  1569961321105 }
// { probability: 0.45, metric: "awareness", label: "calm", timestamp:  1569961321110 }

// Demo
mind.calm().subscribe(({ probability }) => {
  if (probability < 0.25) {
    musicPlayer.recommendGenre("classical");
  }
});
```

#### Focus

Constantly fires and predicts user's focus level from passive cognitive state.

```js
const mind = new Notion();

mind.focus().subscribe(focus => {
  console.log(focus);
});

// { probability: 0.51, metric: "awareness", label: "focus", timestamp:  1569961321102 }
// { probability: 0.56, metric: "awareness", label: "focus", timestamp:  1569961321106 }
// { probability: 0.62, metric: "awareness", label: "focus", timestamp:  1569961321111 }

// Demo
mind.focus().subscribe(({ probability }) => {
  if (probability > 0.75) {
    notifications.off();
  }
});
```

#### Kinesis

The Kinesis API is based on the Motor Imagery BCI method. Fires when a user attempts to trigger a side effect from defined thoughts. E.g. motor imagery, etc.

```js
const mind = new Notion();

mind.kinesis("rightHand").subscribe(intent => {
  // Switch light off/on
  light.togglePower();
  console.log(intent);
});

// { probability: 0.93, label: "rightHand", timestamp: 1569961321174, metric: "kinesis"

mind.kinesis("liftHand").subscribe(intent => {
  // Launch drone
  drone.launch();
  console.log(intent);
});

// { probability: 0.92, label: "liftHand", timestamp: 1569961321191, type: "kinesis"  }
```

### Device / Info

Non-mutable device information.

##### Metrics:

```js
interface IInfo {
  deviceId: string;
  channels: number;
  channelNames: Array<string>;
  samplingRate: number;
  manufacturer: string;
  model: string;
  osVersion: string;
  apiVersion: string;
}
```

```js
import { Notion } from "@neurosity/notion";

const notion = new Notion();

const info = await notion.getInfo();
console.log(info); // { channels: 8, samplingRate: 250, ... }
```

### Device / Status

##### Metrics:

- battery: Number
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

### Channel analysis

```js
import { Notion } from "@neurosity/notion";

const notion = new Notion();

notion.channelAnalysis().subscribe(channelAnalysis => {
  console.log(channelAnalysis); // channel analysis: { FC1: 1, FC2: 0, FC3: -1, FC4: 1, ... }
});
```

#### Training

Options

```ts
interface ITraining {
  metric: string;
  label: string;
  duration: Date; // milliseconds
  fit?: boolean = false;
  timestamp?: Date;
}
```

Example

```js
const mind = new Notion();

mind.training.record({
  metric: "kinesis",
  label: "rightHand",
  duration: 5000
});
```

#### Brainwaves

##### Metrics:

- raw
- timestamp
- frequency
- psd

```js
const mind = new Notion();

mind.brainwaves().subscribe(brainwaves => {
  console.log(brainwaves);
  /* 
  {
    data: [Number, ... , Number],
    timestamp: Date,
    frequency: [
      [Number, ... , Number]
    ],
    psd: [Number, ... , Number]
  }
  */
});
```

Optionally, metrics can be filtered by adding their comma-separated names.

```js
brainwaves("frequency").subscribe(brainwaves => {
  console.log(brainwaves);
  /* 
  { frequency: [
      [Number, ... , Number]
    ]
  }
  */
});
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

- Security audit
- Document how to get `deviceId`
- Publish to cdn
