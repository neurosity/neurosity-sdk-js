const { Notion } = require("../..");

const notion = new Notion({
  cloud: true,
  deviceId: process.env.DEVICE_ID,
  metricsAllowed: ["emotion", "kinesis"]
});

console.log("options", notion.options);

notion.kinesis("leftHandPinch").subscribe(kinesis => {
  console.log("kinesis", kinesis);
});
