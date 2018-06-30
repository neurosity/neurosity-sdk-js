const { Notion } = require("../..");

const notion = new Notion({
  cloud: true,
  deviceId: "df7a02157bfa623941d229984525246f"
});

notion.getInfo().then(info => {
  console.log("info", info);
});

notion.channelAnalysis().subscribe(channelAnalysis => {
  console.log("channelAnalysis", channelAnalysis);
});
