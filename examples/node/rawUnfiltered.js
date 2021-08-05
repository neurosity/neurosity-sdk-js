const { Notion } = require("../..");

const notion = new Notion({
  autoSelectDevice: false
});

(async () => {
  await notion
    .login({
      email: process.env.NEUROSITY_EMAIL,
      password: process.env.NEUROSITY_PASSWORD
    })
    .catch((error) => {
      console.log("error", error);
    });

  await notion.selectDevice(["deviceNickname", "Crown-C98"]);

  // data does not get notch or band pass filters applied unlike the `raw` option
  notion.brainwaves("powerByBand").subscribe((brainwaves) => {
    console.log("brainwaves", brainwaves);
  });
})();
