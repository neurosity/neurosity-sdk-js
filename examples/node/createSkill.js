const { createSkill, isSkill } = require("../..");

const connect = createSkill((notion, context) => {
  console.log("notion", notion);
  console.log("context", context);
});

console.log("isSkill(connect)", isSkill(connect));

const context = {
  deviceId: "concept1",
  skill: {
    metrics: ["kinesis"]
  }
};

const run = connect(context);

run();
