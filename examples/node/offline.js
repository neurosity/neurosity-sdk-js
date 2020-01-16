const { Notion } = require("../..");

const notion = new Notion({
  deviceId: process.env.NEUROSITY_DEVICE_ID,
  transport: "offline"
});

(async () => {
  await notion.login({
    email: process.env.NEUROSITY_EMAIL,
    password: process.env.NEUROSITY_PASSWORD
  });

  // notion.status().subscribe(status => {
  //   console.log("status", status);
  // });

  setTimeout(() => {
    notion.calm().subscribe(calm => {
      console.log("calm", calm);
    });
  }, 2000);
})();
