const { createSkill } = require("../..");

export default createSkill((notion, context) => {
  console.log("notion", notion);
  console.log("context", context);

  notion.kinesis().subscribe(console.log);

  // should throw error as is not an allowed metric
  // notion.emotion().subscribe(console.log);
});
