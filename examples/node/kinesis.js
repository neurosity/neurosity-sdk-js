const { Notion } = require("../..");

const notion = new Notion({
  deviceId: process.env.DEVICE_ID
});

notion.kinesis("leftHandPinch").subscribe(kinesis => {
  console.log("kinesis", kinesis);
});
