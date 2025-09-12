import { Neurosity } from "../../src/index";

export default async function ({
  email,
  password
}: {
  email: string;
  password: string;
}) {
  const neurosity = new Neurosity();

  await neurosity.login({
    email: email,
    password: password
  });

  neurosity.calm().subscribe();
  neurosity.focus().subscribe();

  let i = 0;
  setInterval(() => {
    neurosity.selectDevice((devices) => devices[i]);
    i = i === 0 ? 1 : 0;
  }, 5000);

  neurosity.onDeviceChange().subscribe((device) => {
    console.log("Changed device to", device.deviceId);
  });

  neurosity.status().subscribe((status) => {
    console.log("status", status.battery);
  });

  neurosity.settings().subscribe((settings) => {
    console.log("settings", settings);
  });
}
