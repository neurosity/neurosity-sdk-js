const { Notion } = require("../..");

new Notion({
  deviceId: process.env.NEUROSITY_DEVICE_ID
});

setTimeout(() => {
  new Notion({
    deviceId: process.env.NEUROSITY_DEVICE_ID
  });
}, 2000);
