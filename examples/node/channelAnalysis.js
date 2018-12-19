const { Notion } = require("../..");

const notion = new Notion({
  deviceId: process.env.DEVICE_ID
});

notion.channelAnalysis().subscribe(channelAnalysis => {
  console.log("channelAnalysis", channelAnalysis);
});
