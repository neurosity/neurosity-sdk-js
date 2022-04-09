import firebase from "firebase/compat/app";

import { FirebaseApp } from "./FirebaseApp";
import { createDeviceStore } from "./deviceStore";
import { NotionDependencies } from "../../types/options";

const SERVER_TIMESTAMP = firebase.database.ServerValue.TIMESTAMP;

type FirebaseDeviceOptions = {
  deviceId: string;
  firebaseApp: FirebaseApp;
  dependencies: NotionDependencies;
};

/**
 * @hidden
 */
export class FirebaseDevice {
  static serverType = "firebase";
  protected app: firebase.app.App;
  protected deviceStore;

  constructor({
    deviceId,
    firebaseApp,
    dependencies
  }: FirebaseDeviceOptions) {
    this.app = firebaseApp.app;
    this.deviceStore = createDeviceStore(
      this.app,
      deviceId,
      dependencies.subscriptionManager
    );
  }

  public get timestamp(): any {
    return SERVER_TIMESTAMP;
  }

  public dispatchAction(action): Promise<any> {
    return this.deviceStore.dispatchAction(action);
  }

  public async getInfo(): Promise<any> {
    return await this.deviceStore.once("info");
  }

  public onNamespace(namespace: string, callback: Function): Function {
    return this.deviceStore.onNamespace(namespace, callback);
  }

  public async onceNamespace(namespace: string): Promise<any> {
    return await this.deviceStore.once(namespace);
  }

  public offNamespace(namespace: string, listener: Function): void {
    this.deviceStore.offNamespace(namespace, listener);
  }

  public async getTimesync(): Promise<number> {
    const response = await this.dispatchAction({
      command: "timesync",
      action: "get",
      responseRequired: true,
      responseTimeout: 250
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
  public onMetric(subscription, callback): Function {
    return this.deviceStore.onMetric(subscription, callback);
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
    const subscriptionId =
      this.deviceStore.subscribeToMetric(subscription);
    return subscriptionId;
  }

  /**
   * Removes subscription in path:
   * /devices/:deviceId/subscriptions/:subscriptionId
   *
   * @param subscription
   */
  public unsubscribeFromMetric(subscription): void {
    this.deviceStore.unsubscribeFromMetric(subscription);
  }

  /**
   * Removes metric listener
   * /devices/:deviceId/metric
   * or
   * /devices/:deviceId/metric/label
   *
   * @param subscription
   * @param listener
   */
  public removeMetricListener(subscription, listener: Function): void {
    this.deviceStore.removeMetricListener(subscription, listener);
  }

  public async changeSettings(settings): Promise<void> {
    return this.deviceStore.update("settings", settings);
  }

  public async getSkill(bundleId): Promise<any> {
    return await this.deviceStore.lastOfChildValue(
      "skills",
      "bundleId",
      bundleId
    );
  }

  public disconnect() {
    this.deviceStore.disconnect();
  }
}
