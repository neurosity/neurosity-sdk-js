---
id: version-3.8.0-getting-started
title: Your First Application
original_id: getting-started
---
Welcome to Neurosity's NotionJS repository. To begin, you'll need to set up an account one time with Neurosity via [console.neurosity.co](consle.neurosity.co). Learn how to [create an account with Neurosity Developer Console](https://support.neurosity.co/hc/en-us/articles/360036196792).

## Prerequisites

To download the necessary tools, clone the repository, and install dependencies via `npm`, you need network access. 

### NPM

You'll need the following tools:

- [Git](https://git-scm.com)
- [Node.JS](https://nodejs.org/en/), **x64**, version `>= 10.x`, `<= 12.x`
- [NPM](https://npmjs.org), use a [package manager](https://nodejs.org/en/download/package-manager/) to install.

Install and build all of the dependencies using [`NPM`](https://npmjs.org)

### VSCode

We'll be using [VSCode](https://code.visualstudio.com/download) to program this tutorial and our extension with powered by Notion. Check out our guide to [installing and getting started with VSCode and the Notion extension](https://support.neurosity.co/hc/en-us/articles/360036195712-Installing-and-using-the-VSCode-extension).

### Tutorial Repository

Want to see the complete project befor reading anymore? You can view all the code from this project in it's [repository on Github](https://github.com/neurosity/app-hello-world-notion-js).

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
description: My first application using Notion
entry point: (index.js) 
test command: 
git repository: 
keywords: notion
author: Hans Berger
license: (ISC) MIT
```

<p align="center">
  <img alt="Initial set up of NPM project" src="docs/images/tutorial/npm_init.png">
</p>

Next you'll want to launch a VSCode window for the newly created project.

```bash
code .
```

### Working in VSCode

You'll need to launch a terminal window inside VS Code, you may toggle the terminal with `CTRL+~`.

<p align="center">
  <img alt="Toggle command line" src="docs/images/tutorial/vscode-toggle-command-line.png">
</p>

To create a new file, you may select the new file button.

<p align="center">
  <img alt="Highlighting new file button in vscode" src="docs/images/tutorial/vscode-new-file-button.png">
</p>

Go ahead and make a new file called `index.js`, we'll use it soon as the base of our new project.

<p align="center">
  <img alt="Created a new file called index.js" src="docs/images/tutorial/vscode-make-index-js-file.png">
</p>

### Add Dependencies

The first dependency we need to install is from Neurosity, it's called Notion. From the command line, enter:

```bash
npm install @neurosity/notion
```

We'll end up using some environment variables from a `.env` file, so go ahead and install another dependency for that:

```bash
npm install dotenv
```

That's it for now!

## Adding Notion to a Node Project

### Add Notion Dependency

Importing libraries in Node is quite simple, all you have to do is add 

## Dive right into development

You'll want to [learn how to authenticate](/docs/api/authentication) with Notion next using your [console.neurosity.co](console.neurosity.co) login.

If you're looking for exact API references, check out the [API section](/docs/ref/index) of these docs!