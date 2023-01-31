---
id: oauth
title: OAuth
---

## Registering your app

OAuth requires for developers to register their apps with Neurosity. To register you app, please email [support@neurosity.co](mailto:support@neurosity.co).

During the registration process, you'll be asked to specify which scopes you'll like to have access to.

### Example Project

The quickest way to implement OAuth is to fork the [example project](https://github.com/neurosity/neurosity-oauth-example).

### OAuth Scopes

The following individual scopes will allow your app to access certain Neurosity resources.

| Scope                    | Description              |
| ------------------------ | ------------------------ |
| read:accelerometer       | Live Accelerometer       |
| write:brainwave-markers  | Add Brainwave Markers    |
| read:brainwaves          | Live Brainwaves          |
| write:brainwaves         | Record Brainwaves        |
| read:memories:brainwaves | Read Brainwave Datasets  |
| read:calm                | Live Calm                |
| read:memories:calm       | Historical Calm          |
| read:focus               | Live Focus               |
| read:memories:focus      | Historical Focus         |
| read:devices-info        | Live Device(s) Info      |
| write:haptics            | Activate Haptics         |
| read:kinesis             | Live Kinesis             |
| write:kinesis            | Create Kinesis Trainings |
| read:devices-settings    | Read Device(s) Settings  |
| read:signal-quality      | Live Signal Quality      |
| read:status              | Live Device(s) Status    |

> Only request scopes that you inted to use in your app.

### Redirect URIs

Another part of the registration process involves specifying one or more reidrect URIs. The Redirect URI(s)
validate the URI the OAuth workflow will use to redirect back to your app after the user has granted or denied OAuth access.

Some examples:

```bash
https://yourwebapp.com/
http://localhost:3000
```

## Implement Cloud Functions

Implementing OAuth requires two server-side (node.js) enpoints to be implemented. Make sure you have the following environment variables available at runtime for both cloud functions.

```
NEUROSITY_OAUTH_CLIENT_ID=<your client id>
NEUROSITY_OAUTH_CLIENT_SECRET=<your client secret>
NEUROSITY_OAUTH_CLIENT_REDIRECT_URI=http://localhost:3000
```

### First Cloud Function: createOAuthURL

The first function wraps the [createOAuthURL](/reference/classes/neurosity#createOAuthURL) SDK method. This method creates client-specific OAuth URL. This is the first step of the OAuth workflow. Use this function to create a URL you can use to redirect users to the Neurosity sign-in page.

The following cloud function example was designed to work with Netlify. Let's name this function `get-neurosity-oauth-url`.

```js
const { Neurosity } = require("@neurosity/sdk");

const neurosity = new Neurosity({
  autoSelectDevice: false
});

exports.handler = async function (event) {
  return neurosity
    .createOAuthURL({
      clientId: process.env.NEUROSITY_OAUTH_CLIENT_ID,
      clientSecret: process.env.NEUROSITY_OAUTH_CLIENT_SECRET,
      redirectUri: process.env.NEUROSITY_OAUTH_CLIENT_REDIRECT_URI,
      responseType: "token",
      state: Math.random().toString().split(".")[1], // A random string is required for security reasons
      scope: [
        "read:devices-info",
        "read:devices-status",
        "read:signal-quality",
        "read:brainwaves"
      ]
    })
    .then((url) => ({
      statusCode: 200,
      body: JSON.stringify({ url })
    }))
    .catch((error) => ({
      statusCode: 400,
      body: JSON.stringify(error.response.data)
    }));
};
```

### Second Cloud Function: getOAuthToken

The [getOAuthToken](/reference/classes/neurosity#getOAuthToken) method retreives the client-specific OAuth token for a given userId.

Here's an example of a cloud function that receives a `userId` via query params and loads the client id and client secret securely via environment variables.

Let's name this function `get-neurosity-custom-token`.

```js
const { Neurosity } = require("@neurosity/sdk");

const neurosity = new Neurosity({
  autoSelectDevice: false
});

exports.handler = async function (event) {
  const userId = event.queryStringParameters?.userId;

  return neurosity
    .getOAuthToken({
      clientId: process.env.NEUROSITY_OAUTH_CLIENT_ID,
      clientSecret: process.env.NEUROSITY_OAUTH_CLIENT_SECRET,
      userId
    })
    .then((token) => ({
      statusCode: 200,
      body: JSON.stringify(token)
    }))
    .catch((error) => ({
      statusCode: 200,
      body: JSON.stringify(error.response.data)
    }));
};
```

## Integrate to your User Interface

Now that your app is registered and the 2 cloud functions are implemented, the last step is to integrate OAuth to your user interface. In this section, the code examples will be using React.

### Add "Connect Neurosity Account" Component

```js
import React from "react";

export function ConnectNeurosityAccountButton() {
  function connectNeurosityAccount() {
    fetch(`/functions/get-neurosity-oauth-url`)
      .then(({ data }) => {
        if ("url" in data) {
          // Takes the url returned by the cloud function and redirects the browser to the Neurosity OAuth sign-in page
          window.location.href = data.url;
        } else {
          console.error(`Error: Did not receive url`);
        }
      })
      .catch((error) => {
        console.error(error.message);
      });
  }

  return (
    <button onClick={connectNeurosityAccount}>Connect Neurosity Account</button>
  );
}
```

### Manage the Auth state

We'll import and create a new instance of the Neurosity SDK. Then, add a hook for Neurosity auth state management.

```js
import { Neurosity } from "@neurosity/sdk";
import { useState, useEffect } from "react";

const neurosity = new Neurosity({
  autoSelectDevice: false
});

const initialState = {
  loading: true,
  user: null,
  error: null
};

export function useNeurosity() {
  const [state, setState] = useState(initialState);
  const { customToken } = useOAuthResult();

  // Fires everytime an uth session starts or ends
  useEffect(() => {
    const subscription = neurosity.onAuthStateChanged().subscribe((user) => {
      setState((prevState) => ({
        ...prevState,
        loading: false,
        user
      }));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Calls the Neurosity login with the custom token received via url parameter
  useEffect(() => {
    if (customToken) {
      neurosity.login({ customToken }).catch((error) => {
        setState((prevState) => ({
          ...prevState,
          error: error?.message
        }));
      });
    }
  }, [customToken]);

  return state;
}

function useOAuthResult() {
  const paramsString = window.location.hash.replace("#", "");

  return {
    state: searchParams.get("state"),
    error: searchParams.get("error"),
    customToken: searchParams.get("access_token")
  };
}
```

### Removing Access

After a user has granted your app access to their Neurosity account, it is good practice to give them the option to remove the access. For that, we'll use the SDK [removeOAuthAccess](/reference/classes/neurosity#removeOAuthAccess) method on the client or server side.

The following example removes client-specific OAuth token for a given `userId`. This method requires the SDK to be signed in with OAuth custom token.

```js
import React from "react";

export function RemoveNeurosityAccessButton() {
  async function removeNeurosityAccess() {
    await neurosity.removeOAuthAccess().catch((error) => {
      // handle error here...
    });
  }

  return <button onClick={removeNeurosityAccess}>Remove Access</button>;
}
```

## Authenticating the Neurosity App

It is possible to authenticate the Neurosity mobile app with an OAuth token. To do this, simply add a deep link navigation to your mobile app containing using the following URI scheme:

```ts
neurosity://oauth/YOUR_OAUTH_TOKEN_HERE
```
