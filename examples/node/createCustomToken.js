const { Notion } = require("../..");

const notion = new Notion();

(async () => {
  await notion
    .login({
      email: process.env.NEUROSITY_EMAIL,
      password: process.env.NEUROSITY_PASSWORD
    })
    .catch((error) => {
      console.log("error", error);
    });

  const customToken = await notion
    .createCustomToken()
    .catch((error) => {
      console.log(error);
    });

  if (customToken) {
    console.log(customToken);
  }
})();
