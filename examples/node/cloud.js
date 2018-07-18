const { Notion } = require("../..");

const notion = new Notion({
  cloud: true,
  deviceId: process.env.DEVICE_ID
});

notion.getInfo().then(info => {
  console.log("info", info);
});
