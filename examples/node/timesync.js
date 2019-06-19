const { Notion } = require("../..");

const notion = new Notion({
  deviceId: process.env.DEVICE_ID,
  timesync: true
});
