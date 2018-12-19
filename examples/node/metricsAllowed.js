"use strict";

const { Notion } = require("../..");

const notion = new Notion({
  deviceId: process.env.DEVICE_ID,
  metricsAllowed: ["kinesis"]
});

console.log("options", notion.options);

// Can this be hacked? No.
notion.options.metricsAllowed = [
  ...notion.options.metricsAllowed,
  "emotion"
];

console.log("options", notion.options);

notion.kinesis("leftHandPinch").subscribe(kinesis => {
  console.log("kinesis", kinesis);
});
