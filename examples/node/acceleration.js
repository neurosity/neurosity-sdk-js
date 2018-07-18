const { Notion } = require("../..");

const notion = new Notion({
  cloud: true,
  deviceId: process.env.DEVICE_ID
});

notion.acceleration().subscribe(acceleration => {
  console.log("acceleration", acceleration);
});
