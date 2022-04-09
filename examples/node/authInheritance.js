const { Notion } = require("../..");
const firebase = require("firebase/compat/app");
require("firebase/compat/auth");

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

  const notion = new Notion({
    deviceId: process.env.NEUROSITY_DEVICE_ID
  });

  // Notion login is not required since a previously
  // defined neurosity firebase app is used for Notion

  const info = await notion.getInfo();
  console.log("info", info);

  notion.status().subscribe((status) => {
    console.log("status", status);
  });
})();
