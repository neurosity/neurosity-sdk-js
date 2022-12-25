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

  const customToken = await neurosity.createCustomToken().catch((error) => {
    console.log(error);
  });

  if (customToken) {
    console.log(customToken);
  }
})();
