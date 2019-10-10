const { Notion } = require("../..");

const notion = new Notion({
  deviceId: process.env.DEVICE_ID
});

notion.focus().subscribe(focus => {
  console.log("focus", focus);
});
