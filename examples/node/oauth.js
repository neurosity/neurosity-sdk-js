const { Notion } = require("../..");

const notion = new Notion();

(async () => {
  await notion
    .login({
      customToken: process.env.NEUROSITY_CUSTOM_TOKEN
    })
    .catch((error) => {
      console.log("error", error);
    });

  await notion.selectDevice([
    "deviceId",
    process.env.NEUROSITY_DEVICE_ID
  ]);

  notion.signalQuality().subscribe((data) => {
    console.log("data", data);
  });
})();
