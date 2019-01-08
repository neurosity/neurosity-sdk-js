const { Notion } = require("../..");

(async () => {
  const notion = new Notion({
    deviceId: process.env.DEVICE_ID
  });

  const skill = await notion.skill("ofNF0fadbIoWfOKCogga");

  skill.metric("navigation").subscribe(data => {
    console.log("navigation", data);
  });

  setInterval(() => {
    skill.metric("navigation").next({
      hello: Date.now()
    });
  }, 200);
})();
