const { Neurosity } = require("../..");

const neurosity = new Neurosity({
  deviceId: process.env.NEUROSITY_DEVICE_ID
});

neurosity.onAuthStateChanged().subscribe((user) => {
  console.log("onAuthStateChanged", user ? user.uid : user);
});

(async () => {
  await neurosity.login({
    email: process.env.NEUROSITY_EMAIL,
    password: process.env.NEUROSITY_PASSWORD
  });

  neurosity.status().subscribe((status) => {
    console.log("status", status);
  });

  await neurosity.logout();
})();
