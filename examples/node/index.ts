import { config } from "dotenv";

import inquirer, { Question } from "inquirer";
import fs from "fs";

config();

const deviceId = process.env.NEUROSITY_DEVICE_ID!;
const email = process.env.NEUROSITY_EMAIL!;
const password = process.env.NEUROSITY_PASSWORD!;
const customToken = process.env.NEUROSITY_CUSTOM_TOKEN!;
const idToken = process.env.NEUROSITY_ID_TOKEN!;
const providerId = process.env.NEUROSITY_PROVIDER_ID!;
const apiKey = process.env.NEUROSITY_API_KEY!;

const choiceName = process.argv[2];
const fileExtension = ".ts";

console.log("email -> ", email);
console.log("password -> ", password);
console.log("deviceId -> ", deviceId);
console.log("customToken -> ", customToken);
console.log("idToken -> ", idToken);
console.log("providerId -> ", providerId);
console.log("apiKey -> ", apiKey);

const choices = fs
  .readdirSync("./examples/node")
  .filter((fileName) => fileName !== `index${fileExtension}`);

if (
  choices
    .map((choice) => choice.replace(fileExtension, ""))
    .includes(choiceName)
) {
  const exampleFileName = `${choiceName}${fileExtension}`;
  runFile(exampleFileName).catch((error) => {
    console.log("runFile error -> ", error);
  });
  process.exit(0);
}

const questions: Question[] = [
  {
    type: "list",
    name: "exampleFileName",
    message: `Select an example to run`,
    choices
  }
];

// @ts-expect-error - not clear why the type is not right
inquirer.prompt(questions).then(async ({ exampleFileName }) => {
  runFile(exampleFileName).catch((error) => {
    console.log("runFile error -> ", error);
  });
});

async function runFile(exampleFileName: string) {
  const { default: exampleFunction } = await import(`./${exampleFileName}`);

  if (typeof exampleFunction !== "function") {
    return;
  }

  await exampleFunction({
    email,
    password,
    customToken,
    apiKey,
    deviceId,
    idToken,
    providerId
  });
}
