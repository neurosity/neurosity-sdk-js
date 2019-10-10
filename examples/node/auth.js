const { Notion } = require("../..");

const notion = new Notion({
  deviceId: process.env.DEVICE_ID,
  email: process.env.NEUROSITY_EMAIL,
  password: process.env.NEUROSITY_PASSWORD
});

notion.status().subscribe(status => {
  console.log("status", status);
});
