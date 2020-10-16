import { Observable } from "rxjs";
import firebase from "firebase/app";
import { User } from "@firebase/auth-types";

import { FirebaseApp } from "./FirebaseApp";
import { Credentials } from "../../types/credentials";
import { UserDevices } from "../../types/user";
import { DeviceInfo } from "../../types/deviceInfo";

const SERVER_TIMESTAMP = firebase.database.ServerValue.TIMESTAMP;

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
      .ref(this.getUserDevicesPath())
      .once("value");

    const userDevices: UserDevices | null = snapshot.val();

    const hasDevices: boolean = !!Object.keys(userDevices ?? {}).length;

    if (!hasDevices) {
      return Promise.reject(`No devices found.`);
    }

    const devicesInfoSnapshots = Object.keys(
      userDevices
    ).map((deviceId) =>
      this.app
        .database()
        .ref(this.getDeviceInfoPath(deviceId))
        .once("value")
    );

    const devicesList: DeviceInfo[] = await Promise.all(
      devicesInfoSnapshots
    ).then((snapshots) => snapshots.map((snapshot) => snapshot.val()));

    const validDevices = devicesList.filter((device) => !!device);

    validDevices.sort((a, b) => {
      return (
        userDevices[a.deviceId].claimedOn -
        userDevices[b.deviceId].claimedOn
      );
    });

    return validDevices;
  }

  async addDevice(deviceId: string): Promise<void> {
    const userId = this.user?.uid;

    if (!userId) {
      return Promise.reject(`Please login.`);
    }

    const [isValid, invalidErrorMessage] = await this.isDeviceIdValid(
      deviceId
    )
      .then((isValid) => [isValid])
      .catch((error) => [false, error.message]);

    if (!isValid) {
      return Promise.reject(invalidErrorMessage);
    }

    const claimedByPath = this.getDeviceClaimedByPath(deviceId);
    const userDevicePath = this.getUserClaimedDevicePath(deviceId);

    const [hasError, errorMessage] = await this.app
      .database()
      .ref()
      .update({
        [claimedByPath]: userId,
        [userDevicePath]: {
          claimedOn: SERVER_TIMESTAMP
        }
      })
      .then(() => [false])
      .catch((error) => [true, error.message]);

    if (hasError) {
      return Promise.reject(errorMessage);
    }
  }

  async removeDevice(deviceId: string): Promise<void> {
    const userId = this.user?.uid;

    if (!userId) {
      return Promise.reject(`Please login.`);
    }

    const claimedByPath = this.getDeviceClaimedByPath(deviceId);
    const userDevicePath = this.getUserClaimedDevicePath(deviceId);

    const claimedByRef = this.app.database().ref(claimedByPath);
    const userDeviceRef = this.app.database().ref(userDevicePath);

    const [hasError, errorMessage] = await Promise.all([
      claimedByRef.remove(),
      userDeviceRef.remove()
    ])
      .then(() => [false])
      .catch((error) => [true, error.message]);

    if (hasError) {
      return Promise.reject(errorMessage);
    }
  }

  async isDeviceIdValid(deviceId: string): Promise<boolean> {
    // hex string of 32 characters
    const hexRegEx = /[0-9A-Fa-f]{32}/g;
    if (
      !deviceId ||
      deviceId.length !== 32 ||
      hexRegEx.test(deviceId)
    ) {
      return Promise.reject("The device id is incorrectly formatted.");
    }

    const claimedByPath = this.getDeviceClaimedByPath(deviceId);
    const claimedByRef = this.app.database().ref(claimedByPath);

    const claimedBySnapshot = await claimedByRef
      .once("value")
      .catch(() => null);

    if (!claimedBySnapshot || claimedBySnapshot.exists()) {
      return Promise.reject("The device has already been claimed.");
    }

    return true;
  }

  private getDeviceClaimedByPath(deviceId: string): string {
    return `devices/${deviceId}/status/claimedBy`;
  }

  private getUserClaimedDevicePath(deviceId: string): string {
    const userId = this.user.uid;
    return `users/${userId}/devices/${deviceId}`;
  }

  private getUserDevicesPath(): string {
    const userId = this.user.uid;
    return `users/${userId}/devices`;
  }

  private getDeviceInfoPath(deviceId: string): string {
    return `devices/${deviceId}/info`;
  }
}
