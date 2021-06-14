const { Notion } = require("../..");

const notion = new Notion({
  // important to set `autoSelectDevice` to false when creating an account
  // since there will be no devices to select from
  autoSelectDevice: false
});

notion.onAuthStateChanged().subscribe((user) => {
  console.log(
    "onAuthStateChanged",
    user ? `logged in as ${user.email}` : "not logged in"
  );
});

notion
  .createAccount({
    email: "tester+notion@neurosity.co",
    password: `${Math.random()}`
  })
  .then(() => {
    console.log("account created");
  })
  .catch((error) => {
    console.log("error", error);
  });
