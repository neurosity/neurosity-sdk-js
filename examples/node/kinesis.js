const { Notion } = require("../..");

const notion = new Notion({
  cloud: true,
  deviceId: process.env.DEVICE_ID
});

notion.kinesis("leftHandPinch").subscribe(kinesis => {
  console.log("kinesis", kinesis);
});
