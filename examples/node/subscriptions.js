const { Notion } = require("../..");

const notion = new Notion({
  deviceId: process.env.NEUROSITY_DEVICE_ID
});

const notion2 = new Notion({
  deviceId: process.env.NEUROSITY_DEVICE_ID
});

(async () => {
  await notion.login({
    email: process.env.NEUROSITY_EMAIL,
    password: process.env.NEUROSITY_PASSWORD
  });

  await notion2.login({
    email: process.env.NEUROSITY_EMAIL,
    password: process.env.NEUROSITY_PASSWORD
  });

  const sub1 = notion.signalQuality().subscribe();
  const sub2 = notion.calm().subscribe();
  const sub3 = notion.focus().subscribe();
  const sub4 = notion2.focus().subscribe();

  setTimeout(() => {
    sub2.unsubscribe();
  }, 2000);

  setTimeout(() => {
    notion.goOffline();
    setTimeout(() => {
      sub1.unsubscribe();
    }, 100);
  }, 6000);

  setTimeout(() => {
    notion.goOnline();

    setTimeout(() => {
      sub3.unsubscribe();
    }, 6000);
  }, 10000);
})();
