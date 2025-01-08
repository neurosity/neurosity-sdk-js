import firebase from "firebase/app";

import { FirebaseApp } from "./FirebaseApp";
import { createDeviceStore } from "./deviceStore";
import { SDKDependencies } from "../../types/options";

const SERVER_TIMESTAMP = firebase.database.ServerValue.TIMESTAMP;

type FirebaseDeviceOptions = {
  deviceId: string;
  firebaseApp: FirebaseApp;
  dependencies: SDKDependencies;
};

interface DeviceAction {
  command: string;
  action: string;
  responseRequired?: boolean;
  responseTimeout?: number;
}

interface MetricValue {
  [label: string]: unknown;
}

interface MetricSubscription {
  bundleId?: string;
  [key: string]: unknown;
}

/**
 * @hidden
 */
export class FirebaseDevice {
  static serverType = "firebase";
  protected app: firebase.app.App;
  protected deviceStore;
  public deviceId: string;

  constructor({ deviceId, firebaseApp, dependencies }: FirebaseDeviceOptions) {
    if (!deviceId) {
      throw new Error(`No Device ID provided.`);
    }

    this.deviceId = deviceId;
    this.app = firebaseApp.app;
    this.deviceStore = createDeviceStore(
      this.app,
      deviceId,
      dependencies.subscriptionManager
    );
  }

  public get timestamp(): Record<string, number> {
    return SERVER_TIMESTAMP;
  }

  public dispatchAction(action: DeviceAction): Promise<unknown> {
    return this.deviceStore.dispatchAction(action);
  }

  public async getInfo(): Promise<Record<string, unknown>> {
    return await this.deviceStore.once("info");
  }

  public onNamespace(
    namespace: string,
    callback: (data: unknown) => void
  ): () => void {
    return this.deviceStore.onNamespace(namespace, callback);
  }

  public async onceNamespace(namespace: string): Promise<unknown> {
    return await this.deviceStore.once(namespace);
  }

  public offNamespace(
    namespace: string,
    listener: (data: unknown) => void
  ): void {
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
  public nextMetric(metricName: string, metricValue: MetricValue): void {
    this.deviceStore.nextMetric(metricName, metricValue);
  }

  /**
   * Listens for metrics in path:
   * /devices/:deviceId/metrics/:metricName
   */
  public onMetric(
    subscription: MetricSubscription,
    callback: (data: unknown) => void
  ): () => void {
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
  public subscribeToMetric(subscription: MetricSubscription): string {
    const subscriptionId = this.deviceStore.subscribeToMetric({
      ...subscription,
      serverType: FirebaseDevice.serverType // @deprecated
    });
    return subscriptionId;
  }

  /**
   * Removes subscription in path:
   * /devices/:deviceId/subscriptions/:subscriptionId
   *
   * @param subscription
   */
  public unsubscribeFromMetric(subscription: MetricSubscription): void {
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
  public removeMetricListener(
    subscription: MetricSubscription,
    listener: (data: unknown) => void
  ): void {
    this.deviceStore.removeMetricListener(subscription, listener);
  }

  public async changeSettings(
    settings: Record<string, unknown>
  ): Promise<void> {
    return this.deviceStore.update("settings", settings);
  }

  public async getSkill(bundleId: string): Promise<unknown> {
    return await this.deviceStore.lastOfChildValue(
      "skills",
      "bundleId",
      bundleId
    );
  }

  public async createBluetoothToken(): Promise<string> {
    const [error, token] = await this.app
      .functions()
      .httpsCallable("createBluetoothToken")({
        deviceId: this.deviceId
      })
      .then(({ data }) => [null, data?.token])
      .catch((error) => [error, null]);

    if (error) {
      return Promise.reject(error?.message ?? error);
    }

    if (!token) {
      return Promise.reject(`Failed to create Bluetooth token.`);
    }

    return token;
  }

  public disconnect() {
    this.deviceStore.disconnect();
  }
}
