const { Notion } = require("../..");

// Note: when deviceId is not passed,
// Notion will auto select the first claimed device
const notion = new Notion();

(async () => {
  const response = await notion
    .login({
      email: process.env.NEUROSITY_EMAIL,
      password: process.env.NEUROSITY_PASSWORD
    })
    .catch((error) => {
      console.log("error", error);
    });

  console.log("response", response);

  notion.status().subscribe((status) => {
    console.log("status", status);
  });
})();
