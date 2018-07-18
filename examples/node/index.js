require("dotenv").config();
const inquirer = require("inquirer");
const fs = require("fs");

const deviceId = process.env.DEVICE_ID;

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

inquirer.prompt(questions).then(({ exampleFileName }) => {
  require(`./${exampleFileName}`);
});
