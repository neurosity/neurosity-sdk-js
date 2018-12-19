const { Notion } = require("../..");

const notion = new Notion({
  deviceId: process.env.DEVICE_ID
});

notion.status().subscribe(status => {
  console.log("status", status);
});
