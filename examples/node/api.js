const { Notion } = require("../..");

const notion = new Notion({
  cloud: true,
  deviceId: "df7a02157bfa623941d229984525246f"
});

console.log(
  Object.getOwnPropertyNames(notion).concat(
    Object.getOwnPropertyNames(Object.getPrototypeOf(notion))
  )
);
