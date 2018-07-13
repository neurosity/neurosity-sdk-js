const { Notion } = require("../..");

const notion = new Notion({
  cloud: true,
  deviceId: "df7a02157bfa623941d229984525246f"
});

notion.getInfo().then(info => {
  console.log("info", info);
});

const trainingOptions = {
  metric: "kinesis",
  label: "leftHandPinch"
};

// Show metric and label message to user now
let message = "imagine left hand pinch";
setTimeout(notion.training.record, 3500, trainingOptions);
setTimeout(notion.training.record, 3700, trainingOptions);
setTimeout(notion.training.record, 4000, trainingOptions);

// Show baseline message in 5 seconds from now
setTimeout(() => {
  message = "relax and clear your mind";
}, 5000);

setTimeout(notion.training.record, 8000, {
  ...trainingOptions,
  baseline: true
});

setTimeout(notion.training.record, 8500, {
  ...trainingOptions,
  baseline: true
});

setTimeout(notion.training.record, 9000, {
  ...trainingOptions,
  fit: true,
  baseline: true
});
