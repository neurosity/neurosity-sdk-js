const { Notion } = require("../..");

const notion = new Notion();

(async () => {
  await notion
    .login({
      email: process.env.NEUROSITY_EMAIL,
      password: process.env.NEUROSITY_PASSWORD
    })
    .catch((error) => {
      console.log("error", error);
    });

  notion.calm().subscribe();
  notion.focus().subscribe();

  let i = 0;
  setInterval(() => {
    notion.selectDevice((devices) => devices[i]);
    i = i === 0 ? 1 : 0;
  }, 5000);

  notion.onDeviceChange().subscribe((device) => {
    console.log("Changed device to", device.deviceId);
  });

  notion.status().subscribe((status) => {
    console.log("status", status.battery);
  });

  notion.settings().subscribe((settings) => {
    console.log("settings", settings);
  });
})();
