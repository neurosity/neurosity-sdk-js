const devConfig = {
  apiKey: "AIzaSyCZKZQhNzZubIDV2d5B9yGT6WFtDX0E_H0",
  authDomain: "neurosity-trainer.firebaseapp.com",
  databaseURL: "https://neurosity-trainer.firebaseio.com",
  projectId: "neurosity-trainer",
  storageBucket: "neurosity-trainer.appspot.com",
  messagingSenderId: "1018688804220"
};

const prodConfig = {
  apiKey: "AIzaSyCZKZQhNzZubIDV2d5B9yGT6WFtDX0E_H0",
  authDomain: "neurosity-trainer.firebaseapp.com",
  databaseURL: "https://neurosity-trainer.firebaseio.com",
  projectId: "neurosity-trainer",
  storageBucket: "neurosity-trainer.appspot.com",
  messagingSenderId: "1018688804220"
};

export const configProps = [
  "apiKey",
  "authDomain",
  "databaseURL",
  "projectId",
  "storageBucket",
  "messagingSenderId"
];

export const defaultConfig = process.env.NODE_ENV === "production"
  ? prodConfig
  : devConfig;
