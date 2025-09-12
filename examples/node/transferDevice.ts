import { Neurosity } from "../../src/index";

export default async function ({
  email,
  password
}: {
  email: string;
  password: string;
}) {
  const neurosity = new Neurosity({
    autoSelectDevice: false,
    emulator: true
  });

  neurosity.onAuthStateChanged().subscribe((user) => {
    console.log("onAuthStateChanged", user ? user.uid : user);
  });

  await neurosity.login({
    email: email,
    password: password
  });

  neurosity
    .transferDevice({
      recipientsUserId: "L4orwrLG9hVNLTYBmIzYwKkENLGT",
      // or recipientsEmail: "test@testemail.com",
      deviceId: "994f0e7ce93994f0e71c151e614f54bb"
    })
    .then(() => {
      console.log("success");
    })
    .catch((error) => {
      console.log("error", error.message);
    });
}
