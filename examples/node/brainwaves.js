const { Notion } = require("../..");

const notion = new Notion({
  deviceId: process.env.DEVICE_ID
});

notion.brainwaves("raw", "powerByBand").subscribe(brainwaves => {
  console.log("brainwaves", brainwaves);
});
