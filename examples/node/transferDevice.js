const { Notion } = require("../..");

const notion = new Notion({
  autoSelectDevice: false,
  emulator: true
});

(async () => {
  const auth = await notion
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

  notion
    .transferDevice({
      recipientsEmail: "test@testemail.com",
      deviceId: "fa1de52ce93994f0e71c151e614f54bb"
    })
    .then(() => {
      console.log("success");
    })
    .catch((error) => {
      console.log("error", error.message);
    });
})();
