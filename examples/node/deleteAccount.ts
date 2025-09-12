import { Neurosity } from "../../src/index";

export default async function () {
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

  const email = `tester+neurosity+${Math.random()}@neurosity.co`;

  await neurosity.createAccount({
    email,
    password: `${Math.random()}`
  });

  console.log("account created");

  await new Promise((r) => setTimeout(r, 10000));

  await neurosity.deleteAccount();

  console.log("account deleted");
}
