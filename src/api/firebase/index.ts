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

  public dispatchAction(action): Promise<any> {
    return this.deviceStore.dispatchAction(action);
  }

  public async getInfo(): Promise<any> {
    return await this.deviceStore.once("info");
  }

  public async getSkill(bundleId): Promise<any> {
    return await this.deviceStore.lastOfChildValue(
      "skills",
      "bundleId",
      bundleId
    );
  }

  public onStatus(callback: Function): Function {
    return this.deviceStore.onStatus(callback);
  }

  public offStatus(listener: Function): void {
    this.deviceStore.offStatus(listener);
  }

  public async getTimesync(): Promise<number> {
    const response = await this.dispatchAction({
      command: "timesync",
      action: "get",
      responseRequired: true,
      responseTimeout: 1000
    });
    return response.timestamp;
  }

  /**
   * Pushes metric for each subscriptions in path:
   * /devices/:deviceId/metrics/:metricName
   */
  public nextMetric(
    metricName: string,
    metricValue: { [label: string]: any }
  ): void {
    this.deviceStore.nextMetric(metricName, metricValue);
  }

  /**
   * Listens for metrics in path:
   * /devices/:deviceId/metrics/:metricName
   */
  public onMetric(subscription, callback): void {
    this.deviceStore.onMetric(subscription, callback);
  }

  /**
   * Creates a new and unique subscription in path:
   * /devices/:deviceId/subscriptions/:subscriptionId
   * E.g. /devices/device1/subscriptions/subscription3
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
   * /devices/:deviceId/subscriptions/:subscriptionId
   *
   * @param metric
   * @param subscriptionId
   */
  public unsubscribFromMetric(subscription, listener: Function): void {
    this.deviceStore.unsubscribFromMetric(subscription, listener);
  }

  public get timestamp(): any {
    return firebase.database.ServerValue.TIMESTAMP;
  }

  public disconnect(): Promise<any> {
    return this.app.delete();
  }
}
