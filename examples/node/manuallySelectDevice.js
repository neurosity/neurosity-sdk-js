const { Neurosity } = require("../..");

// Note: when `deviceId` is not passed, and `autoSelectDevice`
// is set to false, the `selectDevice method should be called`
const neurosity = new Neurosity({
  autoSelectDevice: false
});

(async () => {
  await neurosity
    .login({
      email: process.env.NEUROSITY_EMAIL,
      password: process.env.NEUROSITY_PASSWORD
    })
    .catch((error) => {
      console.log("error", error);
    });

  // Select device
  await neurosity.selectDevice((devices) => devices[0]);

  neurosity.status().subscribe((status) => {
    console.log("status", status);
  });
})();
