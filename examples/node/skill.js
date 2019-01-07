const { Notion } = require("../..");

const notion = new Notion({
  deviceId: process.env.DEVICE_ID
});

const skill = notion.skill("controller");

skill.metric("navigation").subscribe(data => {
  console.log("navigation", data);
});

setInterval(() => {
  skill.metric("navigation").next({
    hello: Date.now()
  });
}, 1500);
