import { Neurosity } from "../../src/index";

export default async function ({
  email,
  password
}: {
  email: string;
  password: string;
}) {
  // Note: when `deviceId` is not passed, and `autoSelectDevice`
  // is set to false, the `selectDevice method should be called`
  const neurosity = new Neurosity({
    autoSelectDevice: false
  });

  await neurosity.login({
    email: email,
    password: password
  });

  // Select the firstdevice
  await neurosity.selectDevice((devices) => devices.at(1)!);

  neurosity.status().subscribe((status) => {
    console.log("status", status);
  });
}
