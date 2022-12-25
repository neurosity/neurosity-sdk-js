const { Neurosity } = require("../..");

const neurosity = new Neurosity({
  autoSelectDevice: false
  //timesync: true
});

main();

async function main() {
  await neurosity.login({
    email: process.env.NEUROSITY_EMAIL,
    password: process.env.NEUROSITY_PASSWORD
  });

  // Replace with your device nickname, or remove line and set autoSelectDevice to true
  await neurosity.selectDevice(["deviceNickname", "Crown-85A"]);

  let count = 0;

  neurosity.brainwaves("raw").subscribe((brainwaves) => {
    if (brainwaves.info && brainwaves.info.markers) {
      console.log("Got a marker!", brainwaves.info.markers);
    }
  });

  setTimeout(() => {
    setInterval(() => {
      neurosity.addMarker(`my-marker-${count}`).catch((error) => {
        console.log(error);
      });
      count++;
    }, 100);
  }, 5000);
}
