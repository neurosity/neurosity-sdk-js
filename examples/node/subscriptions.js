const { Notion } = require("../..");

const notion = new Notion({
  deviceId: process.env.NEUROSITY_DEVICE_ID
});

const notion2 = new Notion({
  deviceId: process.env.NEUROSITY_DEVICE_ID
});

(async () => {
  await notion.login({
    email: process.env.NEUROSITY_EMAIL,
    password: process.env.NEUROSITY_PASSWORD
  });

  await notion2.login({
    email: process.env.NEUROSITY_EMAIL,
    password: process.env.NEUROSITY_PASSWORD
  });

  const channelAnalysis = notion
    .channelAnalysis("FC1", "FC2")
    .subscribe(channelAnalysis => {
      console.log("channelAnalysis", channelAnalysis);
    });

  const channelAnalysis2 = notion
    .channelAnalysis("FC1", "FC2")
    .subscribe(channelAnalysis => {
      console.log("channelAnalysis", channelAnalysis);
    });

  const kinesis = notion2.kinesis("push", "pull").subscribe(kinesis => {
    console.log("kinesis", kinesis);
  });

  console.log("subscribed to channelAnalysis");
  console.log("subscribed to kinesis");

  setTimeout(() => {
    channelAnalysis.unsubscribe();
    console.log("unsubscribed from channelAnalysis");
  }, 4000);
})();
