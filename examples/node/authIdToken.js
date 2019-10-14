const { Notion } = require("../..");

const notion = new Notion({
  deviceId: process.env.NEUROSITY_DEVICE_ID
});

(async () => {
  await notion
    .login({
      idToken: process.env.NEUROSITY_ID_TOKEN,
      providerId: process.env.NEUROSITY_PROVIDER_ID
    })
    .catch(error => {
      console.log("error", error);
    });

  notion.status().subscribe(status => {
    console.log("status", status);
  });
})();
