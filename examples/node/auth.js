const { Notion } = require("../..");
// const firebase = require("firebase/app");
// require("firebase/database");
// require("firebase/auth");

// const config = {
//   apiKey: "AIzaSyB0TkZ83Fj0CIzn8AAmE-Osc92s3ER8hy8",
//   authDomain: "neurosity-device.firebaseapp.com",
//   databaseURL: "https://neurosity-device.firebaseio.com",
//   projectId: "neurosity-device",
//   storageBucket: "neurosity-device.appspot.com",
//   messagingSenderId: "212595049674"
// };

const email = process.env.NEUROSITY_EMAIL;
const password = process.env.NEUROSITY_PASSWORD;
const deviceId = process.env.NEUROSITY_DEVICE_ID;

main();

async function main() {
  // const appLabApp = getApp(config);

  // const user = await login(appLabApp).catch(function(error) {
  //   console.log(error.message);
  // });

  // const user = await appLabApp
  //   .auth()
  //   .signInWithEmailAndPassword(email, password)
  //   .catch(function(error) {
  //     console.log(error.message);
  //   });

  // console.log("app lab user", user.user.email);

  const notion = new Notion({
    deviceId
  });

  await notion.login({
    email,
    password
    // accessToken: user.credential,
  });

  notion.status().subscribe(status => {
    console.log("status", status);
  });
}

// function getApp(config) {
//   const appName = config.projectId;
//   const existingApp = firebase.apps.find(app => app.name === appName);
//   return existingApp
//     ? existingApp
//     : firebase.initializeApp(config, appName);
// }

// async function login(app) {
//   const provider = new firebase.auth.GoogleAuthProvider();
//   app.auth().signInWithRedirect(provider);
//   const result = await firebase.auth().getRedirectResult();
//   return result;
// }
