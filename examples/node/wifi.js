const { Headwear } = require("../..");

const brain = new Headwear({
  deviceId: "df7a02157bfa623941d229984525246f"
});

brain.getInfo().then(info => {
  console.log("info", info);
});

brain.status().subscribe(status => {
  console.log("status", status);
});
