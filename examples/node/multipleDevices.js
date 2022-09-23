const { Notion } = require("../..");
const { EMPTY } = require("rxjs");
const { switchMap, map } = require("rxjs/operators");

// Note: when `deviceId` is not passed, and `autoSelectDevice`
// is set to false, the `selectDevice method should be called`
const notion = new Notion({
  autoSelectDevice: false
});

(async () => {
  await notion
    .login({
      email: process.env.NEUROSITY_EMAIL,
      password: process.env.NEUROSITY_PASSWORD
    })
    .catch((error) => {
      console.log("error", error);
    });

  const devices = await notion.getDevices().catch(console.error);

  devices.forEach(async (device) => {
    const { deviceId } = device;
    const deviceInstance = new Notion({ deviceId });

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
