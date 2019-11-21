const { Notion } = require("../..");

const notion = new Notion({
  deviceId: process.env.NEUROSITY_DEVICE_ID
});

notion.onAuthStateChanged().subscribe(user => {
  console.log("onAuthStateChanged", user ? user.uid : user);
});

(async () => {
  await notion.login({
    email: process.env.NEUROSITY_EMAIL,
    password: process.env.NEUROSITY_PASSWORD
  });

  notion.status().subscribe(status => {
    console.log("status", status);
  });

  await notion.logout();
})();
