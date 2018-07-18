const { Notion } = require("../..");

const notion = new Notion({
  cloud: true,
  deviceId: process.env.DEVICE_ID
});

console.log(
  Object.getOwnPropertyNames(notion).concat(
    Object.getOwnPropertyNames(Object.getPrototypeOf(notion))
  )
);
