const { Neurosity } = require("../..");

const neurosity = new Neurosity({
  autoSelectDevice: false
});

neurosity.onAuthStateChanged().subscribe((user) => {
  console.log(
    "onAuthStateChanged",
    user ? `logged in as ${user.email}` : "not logged in"
  );
});

neurosity
  .createAccount({
    email: "tester+delete+account@neurosity.co",
    password: `${Math.random()}`
  })
  .then(async () => {
    console.log("account created");

    await new Promise((r) => setTimeout(r, 10000));

    await neurosity.deleteAccount();

    console.log("account deleted");
  })
  .catch((error) => {
    console.log("error", error);
  });
