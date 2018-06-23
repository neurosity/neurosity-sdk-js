# Neurosity's headwear API client

Offline/Cloud real-time API library for Neurosity's headwear.

Read full [documentation](https://github.com/neurosity/doc-headwear-api-js)

> This is a private (soon to be public) module published on npm. Ensure the npm user has access to the neurosity npm org before installing/publishing.

## Install
```bash
npm install @neurosity/headwear
```

## Offline use
``` js
import { Headwear } from “@neurosity/headwear”;

const headwear = new Headwear({
  
});
```

## Cloud use
``` js
import { Headwear } from “@neurosity/headwear”;

const headwear = new Headwear({

});
```

## Making releases

Please use [semver](https://docs.npmjs.com/misc/semver)

```
$ npm version (major|minor|patch)
$ npm push origin master
$ npm publish
