const { Notion } = require("../..");

const notion = new Notion({
  mode: "offline",
  deviceId: "9aac2601ba7587b32359dba127e5958a", //process.env.NEUROSITY_OFFLINE_DEVICE_ID
  databaseURL: "http://10.0.0.13:3001", //"http://localhost:9000",
  authURL: "http://10.0.0.13:3002" //"http://localhost:9099",
});

(async () => {
  const response = await notion
    .login({
      email: "9aac2601ba7587b32359dba127e5958a@neurosity-device.com", // process.env.NEUROSITY_OFFLINE_EMAIL,
      password: "123456" // process.env.NEUROSITY_OFFLINE_PASSWORD
    })
    .catch((error) => {
      console.log("error", error);
    });

  if (!response) {
    console.log("no response");
  }

  notion.status().subscribe((status) => {
    console.log("status", status);
  });

  notion.brainwaves("raw").subscribe((brainwaves) => {
    console.log("brainwaves", brainwaves);
  });
})();
