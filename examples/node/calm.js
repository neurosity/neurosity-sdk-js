const { Notion } = require("../..");

const notion = new Notion({
  deviceId: process.env.DEVICE_ID
});

notion.calm().subscribe(calm => {
  console.log("calm", calm);
});
