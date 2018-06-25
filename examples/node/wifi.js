const { Headwear } = require("../..");

const brain = new Headwear({
  deviceId: "n1"
});

brain.getInfo().then(info => {
  console.log("info", info);
});

brain.status().subscribe(status => {
  console.log("status", status);
});
