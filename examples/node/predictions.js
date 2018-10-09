const { Notion } = require("../..");

const notion = new Notion({
  cloud: true,
  deviceId: process.env.DEVICE_ID
});

notion
  .predictions("leftHandPinch", "jumpingJacks")
  .subscribe(prediction => {
    console.log("prediction", prediction);
  });
