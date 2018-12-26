import firebase from "firebase/app";
import "firebase/database";
import "firebase/auth";

import { getFirebaseConfig } from "./config";
import { createDeviceStore } from "./deviceStore";

/**
 * @hidden
 */
export default class FirebaseClient {
  public serverType = "firebase";
  protected app;
  protected user;
  protected deviceStore;

  constructor(options) {
    this.init(options);
  }

  private init(options) {
    this.app = this.getApp(options);
    this.deviceStore = createDeviceStore(this.app, options.deviceId);

    this.app.auth().signInAnonymously();
    this.app.auth().onAuthStateChanged(user => {
      this.user = user;
    });
  }

  private getApp(options) {
    const appName = options.deviceId;
    const existingApp = firebase.apps.find(app => app.name === appName);
    return existingApp
      ? existingApp
      : firebase.initializeApp(
          getFirebaseConfig(options || {}),
          appName
        );
  }

  public dispatchAction(action) {
    return this.deviceStore.dispatchAction(action);
  }

  public async getInfo() {
    return await this.deviceStore.getInfo();
  }

  public onStatus(callback) {
    this.deviceStore.onStatus(callback);
  }

  /**
   * Listens for metrics in path:
   * /devices/:deviceId/metrics/:clientId/:subscriptionId
   */
  public onMetric(subscriptionId, callback) {
    this.deviceStore.onMetric(subscriptionId, callback);
  }

  /**
   * Creates a new and unique subscription in path:
   * /devices/:deviceId/subscriptions/:clientId/:subscriptionId
   * E.g. /devices/device1/subscriptions/client2/subscription3
   *
   * @param subscription
   * @returns subscriptionId
   */
  public subscribeToMetric(subscription) {
    const subscriptionId = this.deviceStore.subscribeToMetric(
      subscription
    );
    return subscriptionId;
  }

  /**
   * Removes subscription in path:
   * /devices/:deviceId/subscriptions/:clientId/:subscriptionId
   *
   * @param metric
   * @param subscriptionId
   */
  public unsubscribFromMetric(subscriptionId) {
    this.deviceStore.unsubscribFromMetric(subscriptionId);
  }

  public get timestamp(): any {
    return firebase.database.ServerValue.TIMESTAMP;
  }

  public disconnect(): Promise<any> {
    return this.app.delete();
  }
}
