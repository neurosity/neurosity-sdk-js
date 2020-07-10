const { Notion } = require("../..");

// Note: when `deviceId` is not passed, and `autoSelectDevice`
// is set to false, the `selectDevice method should be called`
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

  // Select device
  await notion.selectDevice((devices) => devices[0]);

  notion.status().subscribe((status) => {
    console.log("status", status);
  });
})();
