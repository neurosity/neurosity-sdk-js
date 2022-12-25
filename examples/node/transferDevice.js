const { Neurosity } = require("../..");

const neurosity = new Neurosity({
  autoSelectDevice: false,
  emulator: true
});

(async () => {
  const auth = await neurosity
    .login({
      email: process.env.NEUROSITY_EMULATOR_EMAIL,
      password: process.env.NEUROSITY_EMULATOR_PASSWORD
    })
    .catch((error) => {
      console.log(error);
    });

  if (!auth) {
    return;
  }

  console.log(`logged in as ${auth?.user?.email}`);

  neurosity
    .transferDevice({
      // recipientsEmail: "test@testemail.com",
      recipientsUserId: "L4orwrLG9hVNLTYBmIzYwKkENLGT",
      deviceId: "994f0e7ce93994f0e71c151e614f54bb"
    })
    .then(() => {
      console.log("success");
    })
    .catch((error) => {
      console.log("error", error.message);
    });
})();
