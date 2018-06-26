const { Headwear } = require("../..");

const brain = new Headwear({
  cloud: true,
  deviceId: "df7a02157bfa623941d229984525246f",
  apiKey: "AIzaSyCZKZQhNzZubIDV2d5B9yGT6WFtDX0E_H0"
});

brain.getInfo().then(info => {
  console.log("info", info);
});

brain.status().subscribe(status => {
  console.log("status", status);
});
