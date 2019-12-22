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

  const signalQuality = notion
    .signalQuality()
    .subscribe(signalQuality => {
      console.log("signalQuality", signalQuality);
    });

  const signalQuality2 = notion
    .signalQuality()
    .subscribe(signalQuality => {
      console.log("signalQuality", signalQuality);
    });

  const kinesis = notion2.kinesis("push").subscribe(kinesis => {
    console.log("kinesis", kinesis);
  });

  console.log("subscribed to signalQuality");
  console.log("subscribed to kinesis");

  setTimeout(() => {
    signalQuality.unsubscribe();
    console.log("unsubscribed from signalQuality");
  }, 4000);
})();
