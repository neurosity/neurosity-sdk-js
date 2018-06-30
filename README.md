# Notion Client API by Neurosity

* Universal JavaScript support: Node/Browser/Electron
* Wifi/WebSocket/Offline & Cloud/Firebase/Online modes
* Event-driven multi-client real-time architecture

Read full [documentation](https://github.com/neurosity/doc-notion-api-js)

> This is a private (soon to be public) module published on npm. Ensure the npm user has access to the neurosity npm org before installing/publishing.

## Getting started
```bash
npm install @neurosity/notion
```
Then import the module

##### ESM
``` js
import { Notion } from "@neurosity/notion";
```

##### Node
``` js
const { Notion } = require("@neurosity/notion");
```

##### Browser
``` html
<script type="module">
  import { Notion } from "./node_modules/notion/esm/notion.mjs";
</script>
<script nomodule src="./node_modules/notion/browser/notion.js">
```

## Examples

### Cloud mode  (default)

Utilizes Firebase client for data transport.

``` js
const notion = new Notion({
  cloud: true,
  deviceId: "****",
  apiKey: "************"
});
```

### Wifi mode

Utilizes WebSocket client for data transport.

``` js
const notion = new Notion({
  deviceId: "****"
});
```

Options:

``` ts
interface OptionsI {
  deviceId: string;
  apiKey: string;
  cloud: boolean;
  autoConnect: boolean;
}
```


### Manually connect

``` js
const notion = new Notion({
  autoConnect: false
});

await notion.connect();
```

### Clients

Supported clients include

* Firebase
* WebSocket

Clients should be classes with the following interface.

``` ts
interface BosClient {
  on(): void;
  emit(): void;
  connect(): Promise;
  disconnect(): Promise;
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

### Browser

Builds browser examples and serves examples in the browser with ES modules.

``` bash
npm run examples:browser
```
Go to: [http://localhost:3000](http://localhost:3000)

### Node 

``` bash
npm run examples:node
```

## TODOs

* Add error handling
* Test Auth
* Check for CORS
* Security audit
* Code splitting
  * Firebase should only be loaded if cloud mode is enabled
  * socket.io-client should only be loaded on wifi mode
* Full Documentation
* Document how to get `deviceId`
* Document how to get `apiKey` for cloud mode
* Remove `apiKey` from examples
* Add more examples
* Publish to cdn
