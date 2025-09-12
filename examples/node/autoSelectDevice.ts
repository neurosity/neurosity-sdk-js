import { Neurosity } from "../../src/index";

export default async function ({
  email,
  password
}: {
  email: string;
  password: string;
}) {
  // Note: when deviceId is not passed,
  // Neurosity will auto select the first claimed device
  const neurosity = new Neurosity();

  const response = await neurosity.login({
    email: email,
    password: password
  });

  console.log("response", response);

  neurosity.status().subscribe((status) => {
    console.log("status", status);
  });

  await neurosity.logout();
}
