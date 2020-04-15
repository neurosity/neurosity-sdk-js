import { Observable } from "rxjs";
import firebase from "firebase/app";
import "firebase/database";
import "firebase/firestore";
import "firebase/auth";

import { User } from "@firebase/auth-types";

import { config } from "./config";
import { createDeviceStore } from "./deviceStore";
import { NotionOptions, NotionDependencies } from "../../types/options";
import { Credentials } from "../../types/credentials";

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
export class FirebaseClient {
  static serverType = "firebase";
  protected standalone: boolean;
  protected app: firebase.app.App;
  protected deviceStore;
  public user: User | null;

  constructor(
    options: NotionOptions,
    dependencies: NotionDependencies
  ) {
    this.init(options, dependencies);
  }

  private init(
    options: NotionOptions,
    dependencies: NotionDependencies
  ) {
    this.app = this.getApp(options.deviceId);
    this.standalone = this.app.name === options.deviceId;
    this.deviceStore = createDeviceStore(
      this.app,
      options.deviceId,
      SERVER_TIMESTAMP,
      dependencies.subscriptionManager
    );

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

  goOffline() {
    this.app.database().goOffline();
  }

  goOnline() {
    this.app.database().goOnline();
  }

  private getApp(deviceId: string) {
    const notionAppName = deviceId;
    const moduleApps = firebase.apps;
    const browserApps =
      typeof window !== "undefined" &&
      "firebase" in window &&
      "apps" in window.firebase
        ? window.firebase.apps
        : [];

    const neurosityApp = [...moduleApps, ...browserApps].find(
      (app: any) =>
        app.name === "[DEFAULT]" &&
        app.options.databaseURL === config.databaseURL
    );

    if (neurosityApp) {
      return neurosityApp;
    }

    const notionApp = moduleApps.find(
      (app) => app.name === notionAppName
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
    const subscriptionId = this.deviceStore.subscribeToMetric(
      subscription
    );
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

  public get timestamp(): any {
    return SERVER_TIMESTAMP;
  }

  public async changeSettings(settings): Promise<void> {
    return this.deviceStore.update("settings", settings);
  }

  public disconnect(): Promise<any> {
    if (this.standalone) {
      return this.app.delete();
    }
    return Promise.resolve();
  }
}
