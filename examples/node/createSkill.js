const { createSkill } = require("../..");

module.exports = createSkill((neurosity, skill) => {
  console.log("neurosity", neurosity);
  console.log("skill instance", skill);

  skill.metric("marker").subscribe((data) => {
    console.log(data);
    // { timestamp: 23453632423 }
  });

  skill.metric("navigation").next({
    right: true
  });

  neurosity.kinesis("liftRightArm").subscribe(() => {});

  // should throw error as is not an allowed metric
  // neurosity.emotion().subscribe(console.log);

  return async () => {
    // Any additional clean-up here
  };
});
