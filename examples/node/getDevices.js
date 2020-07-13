const { Notion } = require("../..");

// Note: when `deviceId` is not passed, and `autoSelectDevice`
// is set to not set (defaults to true), the first claimed
// device will be automatically selected.
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

  notion
    .getDevices()
    .then((devices) => {
      console.log("devices", devices);
    })
    .catch((error) => {
      console.error("devices catch", error);
    });
})();
