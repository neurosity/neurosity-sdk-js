# Neurosity's headwear API client

Wifi + Cloud real-time API library for Neurosity's headwear.

Read full [documentation](https://github.com/neurosity/doc-headwear-api-js)

> This is a private (soon to be public) module published on npm. Ensure the npm user has access to the neurosity npm org before installing/publishing.

## Install
```bash
npm install @neurosity/headwear
```

Modes

* Wifi
* Cloud

## Wifi mode (default)

Utilizes WebSocket client for data transport.

``` js
import Headwear from “@neurosity/headwear”;

const headwear = new Headwear({
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

## Cloud mode

Utilizes Firebase client for data transport.

``` js
import Headwear from “@neurosity/headwear”;

const headwear = new Headwear({
  cloud: true,
  deviceId: "****",
  apiKey: "************"
});
```

## Manually connect

``` js
import Headwear from “@neurosity/headwear”;

const headwear = new Headwear({
  autoConnect: false
});

await headwear.connect();
```

## Clients

Supported clients include

* WebSocket
* Firebase

Clients should be classes with the following interface.

``` ts
interface BosClient {
  on(): void;
  emit(): void;
  connect(): Promise;
  disconnect(): Promise;
}
``` 

## Making releases

Please use [semver](https://docs.npmjs.com/misc/semver)

```
$ npm version (major|minor|patch)
$ npm push origin master
$ npm publish
```

## Examples

### Browser

``` bash
npm run examples:browser
```

Builds browser examples and serves examples in the browser with ES modules.

### Node 

* node

``` bash
node ./examples/node/wifi
node ./examples/node/cloud
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
* Firebase dependecy is fixed, upgrade after [#880](https://github.com/firebase/firebase-js-sdk/issues/880)