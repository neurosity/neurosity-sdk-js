import firebase from "@firebase/app";
import "@firebase/auth";
import { defaultConfig, configProps } from "./config";

import { createDeviceStore } from "./deviceStore";

const { apps, initializeApp, auth } = firebase;

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

export default class FirebaseClient {
  user;
  deviceStore;

  constructor(options) {
    this.init(options);
  }

  private init(options) {
    if (!apps.length) {
      initializeApp(getFirebaseConfig(options || {}));
    }

    this.deviceStore = createDeviceStore(options.deviceId);

    auth().signInAnonymously();
    auth().onAuthStateChanged(user => {
      this.user = user;
    });
  }

  public async getInfo() {
    return await this.deviceStore.getInfo();
  }

  public onMetric(metric, callback) {
    this.deviceStore.onMetric(metric, callback);
  }

  public onStatusChange(callback) {
    this.deviceStore.onStatus(callback);
  }

  // @TODO: support setting props
  public subscribe(metric, ...props) {
    this.deviceStore.subscribeToMetric(metric);
  }

  public unsubscribe(metric) {
    this.deviceStore.unsubscribFromMetric(metric);
  }

  public connect() {}

  public disconnect() {}
}
