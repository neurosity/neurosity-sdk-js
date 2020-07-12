import { Observable } from "rxjs";
import firebase from "firebase/app";
import { User } from "@firebase/auth-types";

import { FirebaseApp } from "./FirebaseApp";
import { Credentials } from "../../types/credentials";
import { DeviceInfo, UserDevices, Device } from "../../types/device";

/**
 * @hidden
 */
export const credentialWithLink: Function =
  firebase.auth.EmailAuthProvider.credentialWithLink;

/**
 * @hidden
 */
export function createUser(...args) {
  return new (firebase as any).User(...args);
}

/**
 * @hidden
 */
export class FirebaseUser {
  public app: firebase.app.App;
  public user: User | null;

  constructor(firebaseApp: FirebaseApp) {
    this.app = firebaseApp.app;

    this.app.auth().onAuthStateChanged((user: User | null) => {
      this.user = user;
    });
  }

  public auth() {
    return this.app.auth();
  }

  onAuthStateChanged(): Observable<User | null> {
    return new Observable((observer) => {
      this.app.auth().onAuthStateChanged((user: User | null) => {
        observer.next(user);
      });
    });
  }

  onLogin(): Observable<User> {
    return new Observable((observer) => {
      const unsubscribe = this.app
        .auth()
        .onAuthStateChanged((user: User) => {
          if (!!user) {
            observer.next(user);
            observer.complete();
          }
        });
      return () => unsubscribe();
    });
  }

  login(credentials: Credentials) {
    if ("idToken" in credentials && "providerId" in credentials) {
      const provider = new firebase.auth.OAuthProvider(
        credentials.providerId
      );
      const oAuthCredential = provider.credential(credentials.idToken);
      return this.app.auth().signInWithCredential(oAuthCredential);
    }

    if ("email" in credentials && "password" in credentials) {
      const { email, password } = credentials;
      return this.app
        .auth()
        .signInWithEmailAndPassword(email, password);
    }

    throw new Error(
      `Either email/password or an idToken/providerId is required`
    );
  }

  logout() {
    return this.app.auth().signOut();
  }

  async getDevices() {
    const userId = this.user?.uid;

    if (!userId) {
      return Promise.reject(`Please login.`);
    }

    const snapshot = await this.app
      .database()
      .ref(`/users/${userId}/devices`)
      .once("value");

    const devices: UserDevices | null = snapshot.val();

    const hasDevices: boolean = !!Object.keys(devices ?? {}).length;

    if (!hasDevices) {
      return Promise.reject(`No devices found.`);
    }

    const devicesInfoSnapshots = Object.keys(devices).map((deviceId) =>
      this.app.database().ref(`/devices/${deviceId}/info`).once("value")
    );

    const devicesInfo: DeviceInfo[] = await Promise.all(
      devicesInfoSnapshots
    ).then((snapshots) => snapshots.map((snapshot) => snapshot.val()));

    return devicesInfo.map(
      (deviceInfo: DeviceInfo): Device => ({
        ...deviceInfo,
        ...devices[deviceInfo.deviceId]
      })
    );
  }
}
