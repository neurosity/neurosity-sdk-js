---
id: authentication
title: Authentication
---
We take data privacy very seriously at Neurosity. Should you find a bug or vulnerability, please [submit a request](support.neurosity.co), and we will take your inquiry seriously and work as fast as possible to fix the issue for all.

There are three ways to authenticate with Notion: Email and password, ID Token, and Inheritance. 

### Email and Password

When you sign up for an account on [console.neurosity.co](console.neurosity.co) and claim a device you have three new important items: `deviceId`, `email`, and `password`. If your device is claimed by another user, you will not be able to authenticate with it. If your device is unclaimed, you will not be able to authenticate with it, you will need to claim it on [console.neurosity.co](console.neurosity.co).

```js
import { Notion } from "@neurosity/notion";

main();

async function main() {
  const notion = new Notion({
    deviceId: "123...XYZ"
  });

  await notion.login({
    email: "hans.berger@neurosity.co",
    password: "eegDisc0verer!"
  })
    .catch(error => {
      console.log("Log in error", error);
    });

  console.log("logged in!");

  await notion.logout()
    .catch(error => {
      console.log("Log out error", error);
    })
  
  console.log("logged out!");
}
```

### ID Token

There are times when you will want to ID Token to authenticate a Notion device. 

```js
import { Notion } from "@neurosity/notion";

main();

async function main() {
  const notion = new Notion({
    deviceId: "123...XYZ"
  });

  await notion
    .login({
      idToken: process.env.NEUROSITY_ID_TOKEN,
      providerId: process.env.NEUROSITY_PROVIDER_ID
    })
    .catch(error => {
      console.log("error", error);
    });
  // logged in!
}
```

### Inheritance

The third and final way to login is through inheritance through a firebase instance. This method requires the most work, but can be useful because !ALEX INSERT WHY THIS WOULD BE USEFUL!.

```js
const { Notion } = require("@neurosity/notion");
const firebase = require("firebase/app");
require("firebase/auth");

const config = {
  apiKey: "AIzaSyB0TkZ83Fj0CIzn8AAmE-Osc92s3ER8hy8",
  authDomain: "neurosity-device.firebaseapp.com",
  databaseURL: "https://neurosity-device.firebaseio.com",
  projectId: "neurosity-device",
  storageBucket: "neurosity-device.appspot.com",
  messagingSenderId: "212595049674"
};

firebase.initializeApp(config);

main();

async function main() {
  await firebase
    .auth()
    .signInWithEmailAndPassword(
      process.env.NEUROSITY_EMAIL,
      process.env.NEUROSITY_PASSWORD
    );

  firebase.auth().onAuthStateChanged(user => {
    console.log("app user", user ? user.uid : null);
  });

  const notion = new Notion({
    deviceId: process.env.NEUROSITY_DEVICE_ID
  });

  // Notion login is not required since a previously
  // defined neurosity firebase app is used for Notion

  const info = await notion.getInfo();
  console.log("info", info);

  notion.status().subscribe(status => {
    console.log("status", status);
  });
}
```
