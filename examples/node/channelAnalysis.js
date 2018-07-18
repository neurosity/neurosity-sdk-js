const { Notion } = require("../..");

const notion = new Notion({
  cloud: true,
  deviceId: process.env.DEVICE_ID
});

notion.channelAnalysis().subscribe(channelAnalysis => {
  console.log("channelAnalysis", channelAnalysis);
});
