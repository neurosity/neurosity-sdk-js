const { Neurosity } = require("../..");

// Note: when deviceId is not passed,
// Neurosity will auto select the first claimed device
const neurosity = new Neurosity();

(async () => {
  const response = await neurosity
    .login({
      email: process.env.NEUROSITY_EMAIL,
      password: process.env.NEUROSITY_PASSWORD
    })
    .catch((error) => {
      console.log("error", error);
    });

  console.log("response", response);

  neurosity.status().subscribe((status) => {
    console.log("status", status);
  });
})();
