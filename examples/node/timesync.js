const { Neurosity } = require("../..");

const neurosity = new Neurosity({
  deviceId: process.env.NEUROSITY_DEVICE_ID,
  timesync: true
});

(async () => {
  await neurosity
    .login({
      email: process.env.NEUROSITY_EMAIL,
      password: process.env.NEUROSITY_PASSWORD
    })
    .catch((error) => {
      console.log(error);
    });

  process.stdin.resume();
})();
