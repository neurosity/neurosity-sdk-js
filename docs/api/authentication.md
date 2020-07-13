---
id: authentication
title: Authentication
---

We take data privacy very seriously at Neurosity. Should you find a bug or vulnerability, please [submit a request](support.neurosity.co), and we will take your inquiry seriously and work as fast as possible to fix the issue for all.

There are two ways to authenticate with Notion: Email and password and ID Token

### Email and Password

When you sign up for an account on [console.neurosity.co](https://console.neurosity.co/) and claim a device you have three new important items: `deviceId`, `email`, and `password`. If your device is claimed by another user, you will not be able to authenticate with it. If your device is unclaimed, you will not be able to authenticate with it, you will need to claim it on [console.neurosity.co](https://console.neurosity.co/).

```js
import { Notion } from "@neurosity/notion";

main();

async function main() {
  const notion = new Notion();

  const user = await notion
    .login({
      email: "hans.berger@neurosity.co",
      password: "eegDisc0verer!"
    })
    .catch((error) => {
      console.log("Log in error", error);
    });

  if (user) {
    console.log("logged in!");
  } else {
    return;
  }

  await notion.logout().catch((error) => {
    console.log("Log out error", error);
  });

  console.log("logged out!");
}
```

### ID Token

There are times when you will want to ID Token to authenticate a Notion device.

```js
import { Notion } from "@neurosity/notion";

main();

async function main() {
  const notion = new Notion();

  await notion
    .login({
      idToken: process.env.NEUROSITY_ID_TOKEN,
      providerId: process.env.NEUROSITY_PROVIDER_ID
    })
    .catch((error) => {
      console.log("error", error);
    });
  // logged in!
}
```
