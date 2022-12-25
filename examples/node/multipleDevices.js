const { Neurosity } = require("../..");
const { EMPTY } = require("rxjs");
const { switchMap, map } = require("rxjs/operators");

// Note: when `deviceId` is not passed, and `autoSelectDevice`
// is set to false, the `selectDevice method should be called`
const neurosity = new Neurosity({
  autoSelectDevice: false
});

(async () => {
  await neurosity
    .login({
      email: process.env.NEUROSITY_EMAIL,
      password: process.env.NEUROSITY_PASSWORD
    })
    .catch((error) => {
      console.log("error", error);
    });

  const devices = await neurosity.getDevices().catch(console.error);

  devices.forEach(async (device) => {
    const { deviceId } = device;
    const deviceInstance = new Neurosity({ deviceId });

    deviceInstance
      .onAuthStateChanged()
      .pipe(
        switchMap((user) =>
          user
            ? deviceInstance.status().pipe(
                map((status) => ({
                  [deviceId]: status
                }))
              )
            : EMPTY
        )
      )
      .subscribe((status) => {
        console.log(status);
      });
  });
})();
