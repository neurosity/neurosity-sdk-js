const { Neurosity } = require("../..");

const neurosity = new Neurosity({
  deviceId: process.env.NEUROSITY_DEVICE_ID
});

(async () => {
  await neurosity
    .login({
      idToken: process.env.NEUROSITY_ID_TOKEN,
      providerId: process.env.NEUROSITY_PROVIDER_ID
    })
    .catch((error) => {
      console.log("error", error);
    });

  neurosity.status().subscribe((status) => {
    console.log("status", status);
  });
})();
