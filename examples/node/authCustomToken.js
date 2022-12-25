const { Neurosity } = require("../..");

const neurosity = new Neurosity();

(async () => {
  await neurosity
    .login({
      customToken: process.env.NEUROSITY_CUSTOM_TOKEN
    })
    .catch((error) => {
      console.log("error", error);
    });

  neurosity.status().subscribe((status) => {
    console.log("status", status);
  });
})();
