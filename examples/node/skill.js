const { Notion } = require("../..");

const notion = new Notion({
  deviceId: process.env.DEVICE_ID
});

const mySkill = notion.skill("skill-id-123");

(async _ => {
  await mySkill.install();
  await mySkill.uninstall();
})();
