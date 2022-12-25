const { Neurosity } = require("../..");

const neurosity = new Neurosity();

(async () => {
  await neurosity
    .login({
      email: process.env.NEUROSITY_EMAIL,
      password: process.env.NEUROSITY_PASSWORD
    })
    .catch((error) => {
      console.log("error", error);
    });

  neurosity.calm().subscribe();
  neurosity.focus().subscribe();

  let i = 0;
  setInterval(() => {
    neurosity.selectDevice((devices) => devices[i]);
    i = i === 0 ? 1 : 0;
  }, 5000);

  neurosity.onDeviceChange().subscribe((device) => {
    console.log("Changed device to", device.deviceId);
  });

  neurosity.status().subscribe((status) => {
    console.log("status", status.battery);
  });

  neurosity.settings().subscribe((settings) => {
    console.log("settings", settings);
  });
})();
