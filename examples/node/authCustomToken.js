const { Notion } = require("../..");

const notion = new Notion();

(async () => {
  await notion
    .login({
      customToken: process.env.NEUROSITY_CUSTOM_TOKEN
    })
    .catch((error) => {
      console.log("error", error);
    });

  notion.status().subscribe((status) => {
    console.log("status", status);
  });
})();
