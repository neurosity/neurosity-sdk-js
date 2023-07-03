require("dotenv").config();
const { Neurosity } = require("../..");
const inquirer = require("inquirer");
const fs = require("fs");

const deviceId = process.env.NEUROSITY_DEVICE_ID;
const choiceName = process.argv[2];

const choices = fs
  .readdirSync("./examples/node")
  .filter((fileName) => fileName !== "index.js");

if (choices.map((choice) => choice.replace(".js", "")).includes(choiceName)) {
  const exampleFileName = `${choiceName}.js`;
  runFile(exampleFileName).catch((error) => {
    console.log("runFile error -> ", error);
  });
  return;
}

const questions = [
  {
    type: "list",
    name: "exampleFileName",
    message: `Select an example to run for device id ${deviceId}?`,
    choices
  }
];

inquirer.prompt(questions).then(async ({ exampleFileName }) => {
  runFile(exampleFileName).catch((error) => {
    console.log("runFile error -> ", error);
  });
});

async function runFile(exampleFileName) {
  const exampleFunction = require(`./${exampleFileName}`);

  if (typeof exampleFunction !== "function") {
    return;
  }

  const neurosity = deviceId
    ? new Neurosity({
        deviceId
      })
    : new Neurosity();

  await neurosity.login({
    email: process.env.NEUROSITY_EMAIL,
    password: process.env.NEUROSITY_PASSWORD
  });

  await exampleFunction(neurosity);
}
