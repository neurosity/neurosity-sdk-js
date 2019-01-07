const { createSkill } = require("../..");

module.exports = createSkill((notion, skill) => {
  console.log("notion", notion);
  console.log("skill instance", skill);

  skill.metric("marker").subscribe(data => {
    console.log(data);
    // { timestamp: 23453632423 }
  });

  skill.metric("navigation").next({
    right: true
  });

  notion.kinesis("liftRightArm").subscribe(() => {});

  // should throw error as is not an allowed metric
  // notion.emotion().subscribe(console.log);

  return async () => {
    // Any additional clean-up here
  };
});
