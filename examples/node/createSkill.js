const { createSkill, isSkill } = require("../..");

const connect = createSkill((notion, context) => {
  console.log("notion", notion);
  console.log("context", context);

  notion.kinesis().subscribe(console.log);

  // should throw error as is not an allowed metric
  // notion.emotion().subscribe(console.log);
});

console.log("isSkill(connect)", isSkill(connect));

const context = {
  deviceId: "concept1",
  socketUrl: "http://localhost",
  skill: {
    metrics: ["kinesis"]
  }
};

const run = connect(context);

run();
