require("dotenv").config();
const { Notion } = require("../..");
const inquirer = require("inquirer");
const fs = require("fs");

const deviceId = process.env.NEUROSITY_DEVICE_ID;

const choices = fs
  .readdirSync("./examples/node")
  .filter(fileName => fileName !== "index.js");

const questions = [
  {
    type: "list",
    name: "exampleFileName",
    message: `What do example would you like to run for device id ${deviceId}?`,
    choices
  }
];

inquirer.prompt(questions).then(async ({ exampleFileName }) => {
  const exampleFunction = require(`./${exampleFileName}`);

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
});
