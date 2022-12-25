const { Neurosity } = require("../..");

new Neurosity({
  deviceId: process.env.NEUROSITY_DEVICE_ID
});

setTimeout(() => {
  new Neurosity({
    deviceId: process.env.NEUROSITY_DEVICE_ID
  });
}, 2000);
