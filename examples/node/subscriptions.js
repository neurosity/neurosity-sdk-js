const { Neurosity } = require("../..");

const neurosity = new Neurosity({
  deviceId: process.env.NEUROSITY_DEVICE_ID
});

const neurosity2 = new Neurosity({
  deviceId: process.env.NEUROSITY_DEVICE_ID
});

(async () => {
  await neurosity.login({
    email: process.env.NEUROSITY_EMAIL,
    password: process.env.NEUROSITY_PASSWORD
  });

  await neurosity2.login({
    email: process.env.NEUROSITY_EMAIL,
    password: process.env.NEUROSITY_PASSWORD
  });

  const sub1 = neurosity.signalQuality().subscribe();
  const sub2 = neurosity.calm().subscribe();
  const sub3 = neurosity.focus().subscribe();
  const sub4 = neurosity2.focus().subscribe();

  setTimeout(() => {
    sub2.unsubscribe();
  }, 2000);

  setTimeout(() => {
    neurosity.goOffline();
    setTimeout(() => {
      sub1.unsubscribe();
    }, 100);
  }, 6000);

  setTimeout(() => {
    neurosity.goOnline();

    setTimeout(() => {
      sub3.unsubscribe();
    }, 6000);
  }, 10000);
})();
