const defaultConfig = {
  apiKey: "AIzaSyB0TkZ83Fj0CIzn8AAmE-Osc92s3ER8hy8",
  authDomain: "neurosity-device.firebaseapp.com",
  databaseURL: "https://neurosity-device.firebaseio.com",
  projectId: "neurosity-device",
  storageBucket: "neurosity-device.appspot.com",
  messagingSenderId: "212595049674"
};

const configProps = [
  "apiKey",
  "authDomain",
  "databaseURL",
  "projectId",
  "storageBucket",
  "messagingSenderId"
];

export const getFirebaseConfig = (options = {}) =>
  Object.entries({ ...defaultConfig, ...options })
    .filter(([key]) => configProps.includes(key))
    .reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: value
      }),
      {}
    );
