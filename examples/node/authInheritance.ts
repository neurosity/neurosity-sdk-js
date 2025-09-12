import { Neurosity } from "../../src/index";
import { config } from "../../src/api/firebase/config";

import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword
} from "firebase/auth";

export default async function ({
  email,
  password
}: {
  email: string;
  password: string;
}) {
  initializeApp(config);

  onAuthStateChanged(getAuth(), (user) => {
    console.log("app user", user ? user.uid : null);
  });

  const neurosity = new Neurosity();

  await signInWithEmailAndPassword(getAuth(), email, password);

  // Neurosity login is not required since a previously
  // defined neurosity firebase app is used for Neurosity
  const devices = await neurosity.getDevices();
  console.log("devices", devices);
}
