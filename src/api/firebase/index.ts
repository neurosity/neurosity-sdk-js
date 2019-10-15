import firebase from "firebase/app";
import "firebase/database";
import "firebase/auth";

import { FirebaseAuth, User } from "@firebase/auth-types";

import { config } from "./config";
import { createDeviceStore } from "./deviceStore";
import IOptions from "../../types/options";
import { Credentials } from "../../types/credentials";

/**
 * @hidden
 */
export default class FirebaseClient {
  public serverType = "firebase";
  protected app;
  protected auth: FirebaseAuth;
  protected user: User;
  protected deviceStore;

  constructor(options: IOptions) {
    this.init(options);
  }

  private init(options: IOptions) {
    this.app = this.getApp(options.deviceId);
    this.auth = this.app.auth();
    this.deviceStore = createDeviceStore(this.app, options.deviceId);

    this.auth.onAuthStateChanged(user => {
      this.user = user;
    });
  }

  login(credentials: Credentials) {
    if ("idToken" in credentials && "providerId" in credentials) {
      const provider = new firebase.auth.OAuthProvider(
        credentials.providerId
      );
      const oAuthCredential = provider.credential(credentials.idToken);
      return this.auth.signInWithCredential(oAuthCredential);
    }

    if ("email" in credentials && "password" in credentials) {
      const { email, password } = credentials;
      return this.auth.signInWithEmailAndPassword(email, password);
    }

    throw new Error(
      `Either email/password or an idToken/providerId is required`
    );
  }

  private getApp(deviceId: string) {
    const notionAppName = deviceId;
    const neurosityApp = firebase.apps.find(
      (app: any) =>
        app.name === "[DEFAULT]" &&
        app.options.databaseURL === config.databaseURL
    );

    if (neurosityApp) {
      return neurosityApp;
    }

    const notionApp = firebase.apps.find(
      app => app.name === notionAppName
    );
    return notionApp
      ? notionApp
      : firebase.initializeApp(config, notionAppName);
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
