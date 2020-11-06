import firebase from "firebase/app";
import "firebase/database";
import "firebase/auth";
import "firebase/functions";
import "firebase/firestore";

import { config } from "./config";
import { NotionOptions } from "../../types/options";

export const SERVER_TIMESTAMP = firebase.database.ServerValue.TIMESTAMP;

/**
 * @hidden
 */
export class FirebaseApp {
  protected standalone: boolean;
  public app: firebase.app.App;

  constructor(options: NotionOptions) {
    this.app = this.getApp(options.deviceId);
    this.standalone = this.app.name === options.deviceId;
  }

  private getApp(deviceId?: string) {
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

    if (deviceId) {
      const notionAppName = deviceId;
      const notionApp = moduleApps.find(
        (app) => app.name === notionAppName
      );
      return notionApp
        ? notionApp
        : firebase.initializeApp(config, notionAppName);
    }

    return firebase.initializeApp(config);
  }

  goOnline() {
    this.app.database().goOnline();
  }

  goOffline() {
    this.app.database().goOffline();
  }

  public disconnect(): Promise<any> {
    if (this.standalone) {
      return this.app.delete();
    }
    return Promise.resolve();
  }
}
