const { Notion } = require("../..");

(async () => {
  const notion = new Notion({
    deviceId: process.env.DEVICE_ID
  });

  const skill = await notion.skill("ofNF0fadbIoWfOKCogga");

  skill.metric("fromDevice").subscribe(data => {
    console.log("fromDevice", data);
  });

  setInterval(() => {
    skill.metric("fromApp").next({
      hello: Date.now()
    });
  }, 2000);
})();
