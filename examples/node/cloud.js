const { Headwear } = require("../..");

const brain = new Headwear({
  cloud: true,
  deviceId: "df7a02157bfa623941d229984525246f",
  apiKey: "AIzaSyB0TkZ83Fj0CIzn8AAmE-Osc92s3ER8hy8"
});

brain.getInfo().then(info => {
  console.log("info", info);
});

brain.status().subscribe(status => {
  console.log("status", status);
});
