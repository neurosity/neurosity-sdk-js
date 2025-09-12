import { Neurosity } from "../../src/index";
import { EMPTY, switchMap } from "rxjs";

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

  const devices = await neurosity.getDevices();

  if (!devices) {
    throw new Error("No devices found");
  }

  for (const device of devices) {
    const { deviceId } = device;
    const deviceInstance = new Neurosity({ deviceId });

    deviceInstance
      .onAuthStateChanged()
      .pipe(
        switchMap((user) => {
          if (user) {
            return deviceInstance.status();
          }
          return EMPTY;
        })
      )
      .subscribe((status) => {
        console.log(status);
      });
  }
}
