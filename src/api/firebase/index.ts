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

  public async getSkill(id): Promise<any> {
    return await this.deviceStore.once(`skills/${id}`);
  }

  public onStatus(callback: Function): void {
    this.deviceStore.onStatus(callback);
  }

  /**
   * Pushes metric for each subscriptions in path:
   * /devices/:deviceId/metrics/:clientId/:subscriptionId
   * Note: Expensive operation since it fetches all subscriptions
   * each time.
   * @TODO: use SubscriptionManager from @neurosity/api
   */
  public nextMetric(
    metricName: string,
    metricValue: { [label: string]: any }
  ): void {
    this.deviceStore.nextMetric(
      metricName,
      metricValue,
      this.serverType
    );
  }

  /**
   * Listens for metrics in path:
   * /devices/:deviceId/metrics/:clientId/:subscriptionId
   */
  public onMetric(subscriptionId: string, callback): void {
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
  public subscribeToMetric(subscription: any): string {
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
  public unsubscribFromMetric(subscriptionId: string): void {
    this.deviceStore.unsubscribFromMetric(subscriptionId);
  }

  public get timestamp(): any {
    return firebase.database.ServerValue.TIMESTAMP;
  }

  public disconnect(): Promise<any> {
    return this.app.delete();
  }
}
