---
id: your-first-node-app
title: Your First Node App
---

Welcome to the Neurosity SDK documentation site. To begin, you'll need to set up an account one time with Neurosity via [console.neurosity.co](https://console.neurosity.co/). Learn how to [create an account with Neurosity Developer Console](https://support.neurosity.co/hc/en-us/articles/360036196792).

## Prerequisites

To download the necessary tools, clone the repository, and install dependencies via `npm`, you need network access.

### NPM

You'll need the following tools:

- [Git](https://git-scm.com)
- [Node.JS](https://nodejs.org/en/)
- [NPM](https://npmjs.org), use a [package manager](https://nodejs.org/en/download/package-manager/) to install.

Install and build all of the dependencies using [`NPM`](https://npmjs.org)

### VSCode

We'll be using [VSCode](https://code.visualstudio.com/download) to program this tutorial. For a little added fun, we recommend adding the Neurosity VSCode extension to track your flow state while programming. Check out our guide to [installing and getting started with VSCode and the Neurosity extension](https://support.neurosity.co/hc/en-us/articles/360036195712-Installing-and-using-the-VSCode-extension).

### Tutorial Repository

Want to see the complete project before reading anymore? You can view all the code from this project in it's [repository on Github](https://github.com/neurosity/app-hello-world-node-js-sdk).

## Setup your Project

### Hello World Folder

Create a new folder called `hello-world`

```bash
mkdir hello-world
```

Enter into the directory and initialize the `npm` project.

```bash
cd hello-world
npm init
```

You'll need to run through the initial questions:

```bash
package name: (hello-world)
version: (1.0.0)
description: My first application using the Neurosity SDK
entry point: (index.js)
test command:
git repository:
keywords: neurosity
author: Hans Berger
license: (ISC) MIT
```

<p align="center">
  <img alt="Initial set up of NPM project" src="/img/tutorial/npm_init.png" />
</p>

Next, you'll want to launch a VSCode window for the newly created project.

```bash
code .
```

### Working in VSCode

You'll need to launch a terminal window inside VS Code, you may toggle the terminal with `CTRL+~`.

<p align="center">
  <img alt="Toggle command line" src="/img/tutorial/vscode-toggle-command-line.png" />
</p>

To create a new file, you may select the new file button.

<p align="center">
  <img alt="Highlighting new file button in vscode" src="/img/tutorial/vscode-new-file-button.png" />
</p>

Go ahead and make a new file called `index.js`, we'll use it soon as the base of our new project.

<p align="center">
  <img alt="Created a new file called index.js" src="/img/tutorial/vscode-make-index-js-file.png" />
</p>

## Adding the Neurosity SDK to a Node Project

### Add `.gitignore` file

The first thing we want to do is add a file called `.gitignore` to tell git to ignore certain files. Add another file to the root directory called `.gitignore`, then add the following:

```
node_modules
```

On MacOS, we'll go ahead and add another commonly ignored file:

```
.DS_Store
```

<p align="center">
  <img alt="Add a .gitignore file with node_modules" src="/img/tutorial/vscode-gitignore.png" />
</p>

Adding `node_modules` will help VS Code run a little bit better because we're telling it that we don't need to track anything in that folder.

### Install Dependencies

The first dependency we need to install the Neurosity SDK. We'll end up using some environment variables from a `.env` file, so go ahead and install another dependency for that as well. From the command line, enter:

```bash
npm install @neurosity/sdk dotenv
```

<p align="center">
  <img alt="Install dependencies using npm install in the terminal" src="/img/tutorial/vscode-install-dependencies.png" />
</p>

### Add Dependencies to `index.js`

Importing libraries in Node is quite simple, all you have to do is add the following to the top of your index.js file:

```js
const { Neurosity } = require("@neurosity/sdk");
require("dotenv").config();
```

<p align="center">
  <img alt="Add dependencies to the index.js file" src="/img/tutorial/vscode-add-dependencies-to-index.png" />
</p>

### Add start script to package.json

Now head over to the file called `package.json`. The `package.json` is at the core of every Node package. **Ignore the file called `package-lock.json`, it's automatically generated.**

Find the section called `"scripts"` and add a property called `"start"` that will start the node process:

```json
"start": "node index.js"
```

Your `package.json` will look like below once added:

```json
{
  "name": "hello-world",
  "version": "1.0.0",
  "description": "My first application using the Neurosity SDK",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": ["neurosity"],
  "author": "Hans Berger",
  "license": "MIT",
  "dependencies": {
    "@neurosity/sdk": "^3.8.0",
    "dotenv": "^8.2.0"
  }
}
```

### Run the project from the CLI

Navigate back to the terminal and run `npm start` to make sure the project runs without any errors.

```bash
npm start
```

You should see the program run and exit successfully.

<p align="center">
  <img alt="Ran our node program with no errors" src="/img/tutorial/vscode-run-empty-program.png" />
</p>

## Add Authentication

At this point you will need to have [created an account](https://support.neurosity.co/hc/en-us/articles/360036196792-Create-account-with-Neurosity) with [console.neurosity.co](https://console.neurosity.co) and [claimed your device](https://support.neurosity.co/hc/en-us/articles/360037562351).

### Get variables from `.env` file

We'll first attempt to get our environment variables to show what happens when they are not there at runtime. Add the following code to pull the deviceId, email and password from the enviroment variables:

```js
const deviceId = process.env.DEVICE_ID || "";
const email = process.env.EMAIL || "";
const password = process.env.PASSWORD || "";
```

To verify that the variables are not blank, we could add a function to check for that and quit the program if so. Add the following function to your program next:

```js
const verifyEnvs = (email, password, deviceId) => {
  const invalidEnv = (env) => {
    return env === "" || env === 0;
  };
  if (invalidEnv(email) || invalidEnv(password) || invalidEnv(deviceId)) {
    console.error(
      "Please verify deviceId, email and password are in .env file, quitting..."
    );
    process.exit(0);
  }
};
verifyEnvs(email, password, deviceId);

console.log(`${email} attempting to authenticate to ${deviceId}`);
```

Now, if we run our program, we should see an error print out! Run with `npm start` from the CLI.

<p align="center">
  <img alt="Ran our node program with no envs found error" src="/img/tutorial/vscode-no-env-found.png" />
</p>

### Add `.env` file

Next, we'll add a `.env` to store our deviceId, login, and password. Add a new file called `.env` and add your deviceId, email, and password. Learn how to [find your device ID](https://support.neurosity.co/hc/en-us/articles/360037198152-Get-Notion-Device-ID).

```.env
DEVICE_ID="442333d1bcea35533daba9b51234abcd"
EMAIL="hans.berger@neurosity.co"
PASSWORD="Password#1!"
```

<p align="center">
  <img alt="Created a new file called .env" src="/img/tutorial/vscode-env-file.png" />
</p>

Now, if we run our program, we should see a success message print out, informing us that our variables have been extracted successfully.

<p align="center">
  <img alt="Pulled out three variables from .env" src="/img/tutorial/vscode-got-env-variables.png" />
</p>

### Instantiate the Neurosity class

We can then use the `deviceId` to instantiate a new Neurosity by adding the following line to our file.

```js
const neurosity = new Neurosity({
  deviceId
});
```

### Add async login

We need to use an [`async/await`](https://javascript.info/async-await) paradigm for authenticating to the device. Go ahead and create an async function called `main` to the `index.js` file.

```js
const main = async () => {
  await neurosity
    .login({
      email,
      password
    })
    .catch((error) => {
      console.log(error);
      throw new Error(error);
    });
  console.log("Logged in");
};

main();
```

Then run the program with `npm start` in the CLI. If all worked, then you should see:

<p align="center">
  <img alt="Made a function that authenticated with Neurosity" src="/img/tutorial/vscode-main-logged-in.png" />
</p>

## Add Subscriptions

### Calm Subscription

Now that you are authenticated, print out hello world when you're calm increases past 0.3, a significant number.

Add the following code to your main() function after login.

```js
neurosity.calm().subscribe((calm) => {
  if (calm.probability > 0.3) {
    console.log("Hello World!");
  }
});
```

Your index.js file is now ready to print `Hello World!`

<p align="center">
  <img alt="Add code to subscribe to the calm score" src="/img/tutorial/vscode-main-calm-subscribe.png" />
</p>

### Kinesis Training

Head over to the [Developer Console](https://console.neurosity.co) and train Left Hand Pinch. [Learn how to train an imagined movement thought](https://support.neurosity.co/hc/en-us/articles/360036344012-Imagined-thought-training). Do at least 15 trials.

When we write code to interact with the Neurosity SDK, we use camel case, so Left Hand Pinch in code is `leftHandPinch`.

Now that the `leftHandPinch` thought is trained, you'll be able to load it into your device for use.

### Kinesis Subscription

In the `index.js` file we can remove the `calm` subscription from above and replace it with the code below.

Check out the [Kinesis guide](https://docs.neurosity.co/docs/api/kinesis) or [Kinesis API docs](https://docs.neurosity.co/docs/reference/interfaces/kinesis).

```js
neurosity.kinesis("leftHandPinch").subscribe((intent) => {
  console.log("Hello World!");
});
```

Your `index.js` file should look like:

<p align="center">
  <img alt="Add kinesis code to index.js" src="/img/tutorial/vscode-hello-kinesis.png" />
</p>

## Conclusion

Developing with the Neurosity SDK can be a lot of fun! There are two main types of thought processes that Neurosity devices can detect: intent and background. The foreground we consider to be the `kinesis()` where you're intending to do something and the background is `calm()` or `focus()` that occurs in the background of the mind.

### Dive into development

We're looking for talented developers to help us improve the kinesis training. So, head over to the [training guide](https://docs.neurosity.co/docs/guides/training) and learn how to build your own training module.

If you're looking for exact API references, check out the [API section](/docs/reference) of these docs!
