const { Neurosity } = require("../..");
const firebase = require("firebase/app");
require("firebase/auth");

const config = {
  apiKey: "AIzaSyB0TkZ83Fj0CIzn8AAmE-Osc92s3ER8hy8",
  authDomain: "neurosity-device.firebaseapp.com",
  databaseURL: "https://neurosity-device.firebaseio.com",
  projectId: "neurosity-device",
  storageBucket: "neurosity-device.appspot.com",
  messagingSenderId: "212595049674"
};

firebase.initializeApp(config);

(async () => {
  await firebase
    .auth()
    .signInWithEmailAndPassword(
      process.env.NEUROSITY_EMAIL,
      process.env.NEUROSITY_PASSWORD
    );

  firebase.auth().onAuthStateChanged((user) => {
    console.log("app user", user ? user.uid : null);
  });

  const neurosity = new Neurosity({
    deviceId: process.env.NEUROSITY_DEVICE_ID
  });

  // Neurosity login is not required since a previously
  // defined neurosity firebase app is used for Neurosity

  const info = await neurosity.getInfo();
  console.log("info", info);

  neurosity.status().subscribe((status) => {
    console.log("status", status);
  });
})();
