const { Neurosity } = require("../..");

// Note: when `deviceId` is not passed, and `autoSelectDevice`
// is set to not set (defaults to true), the first claimed
// device will be automatically selected.
const neurosity = new Neurosity();

(async () => {
  neurosity.onUserDevicesChange().subscribe((devices) => {
    console.log("devices", devices);
  });

  await neurosity
    .login({
      email: process.env.NEUROSITY_EMAIL,
      password: process.env.NEUROSITY_PASSWORD
    })
    .catch((error) => {
      console.log("error", error);
    });

  neurosity
    .getDevices()
    .then((devices) => {
      console.log("devices (once)", devices);
    })
    .catch((error) => {
      console.error("devices catch", error);
    });
})();
