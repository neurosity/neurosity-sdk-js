const { Neurosity } = require("../..");

const neurosity = new Neurosity({
  // important to set `autoSelectDevice` to false when creating an account
  // since there will be no devices to select from
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
    email: "tester+neurosity@neurosity.co",
    password: `${Math.random()}`
  })
  .then(() => {
    console.log("account created");
  })
  .catch((error) => {
    console.log("error", error);
  });
