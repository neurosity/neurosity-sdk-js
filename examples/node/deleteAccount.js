const { Notion } = require("../..");

const notion = new Notion({
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
    email: "tester+delete+account@neurosity.co",
    password: `${Math.random()}`
  })
  .then(async () => {
    console.log("account created");

    await new Promise((r) => setTimeout(r, 10000));

    await notion.deleteAccount();

    console.log("account deleted");
  })
  .catch((error) => {
    console.log("error", error);
  });
