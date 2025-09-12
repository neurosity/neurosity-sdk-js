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

  await neurosity.createAccount({
    email: `tester+neurosity+${Math.random()}@neurosity.co`,
    password: `${Math.random()}`
  });
}
