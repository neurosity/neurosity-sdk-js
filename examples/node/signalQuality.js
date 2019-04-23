const { Notion } = require("../..");

const notion = new Notion({
  deviceId: process.env.DEVICE_ID
});

notion.signalQuality().subscribe(signalQuality => {
  console.log("signalQuality", signalQuality);
});
