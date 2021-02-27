const { Notion } = require("../..");

const notion = new Notion({
  mode: "offline",
  deviceId: process.env.NEUROSITY_OFFLINE_DEVICE_ID // "9aac2601ba7587b32359dba127e5958a"
});

// console.log("apiKey", process.env.NEUROSITY_OFFLINE_API_KEY);

(async () => {
  // const response = await notion
  //   .login({
  //     apiKey: process.env.NEUROSITY_OFFLINE_API_KEY
  //   })
  //   .catch((error) => {
  //     console.log("error", error);
  //   });

  // if (!response) {
  //   console.log("no response");
  // }

  notion.onDeviceChange().subscribe((selectedDevice) => {
    console.log("selectedDevice", selectedDevice);

    notion.getInfo().then((info) => {
      console.log("info", info);
    });

    notion.status().subscribe((status) => {
      console.log("status", status);
    });

    notion.calm().subscribe((calm) => {
      console.log("calm", calm);
    });
  });
})();

// const response = await notion
//     .login({
//       email: "9aac2601ba7587b32359dba127e5958a@neurosity-device.com", // process.env.NEUROSITY_OFFLINE_EMAIL,
//       password: "123456" // process.env.NEUROSITY_OFFLINE_PASSWORD
//     })
//     .catch((error) => {
//       console.log("error", error);
//     });
