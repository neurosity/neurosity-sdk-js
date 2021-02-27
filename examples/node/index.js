require("dotenv").config();
const { Notion } = require("../..");
const inquirer = require("inquirer");
const fs = require("fs");

const deviceId = process.env.NEUROSITY_DEVICE_ID;

const choices = fs
  .readdirSync("./examples/node")
  .filter((fileName) => fileName !== "index.js");

const questions = [
  {
    type: "list",
    name: "exampleFileName",
    message: `Select an example to run for device id ${deviceId}?`,
    choices
  }
];

const fileNameArgument = process.argv[2];

if (fileNameArgument) {
  runExample(fileNameArgument);
} else {
  inquirer.prompt(questions).then(async ({ exampleFileName }) => {
    runExample(exampleFileName);
  });
}

async function runExample(fileName) {
  const exampleFunction = require(`./${fileName}`);

  if (typeof exampleFunction !== "function") {
    return;
  }

  const notion = new Notion({
    deviceId
  });

  await notion.login({
    email: process.env.NEUROSITY_EMAIL,
    password: process.env.NEUROSITY_PASSWORD
  });

  await exampleFunction(notion);
}
