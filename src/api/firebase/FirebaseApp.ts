import firebase from "firebase/app";
import "firebase/database";
import "firebase/auth";
import "firebase/functions";
import "firebase/firestore";

import { config as onlineConfig } from "./config";
import { NotionOptions, StreamingModes } from "../../types/options";

export const SERVER_TIMESTAMP = firebase.database.ServerValue.TIMESTAMP;

/**
 * @hidden
 */
export class FirebaseApp {
  protected standalone: boolean;
  public app: firebase.app.App;
  public db: firebase.database.Database;
  public isOfflineMode: boolean;
  public databaseURL: string;

  constructor(options: NotionOptions) {
    this.databaseURL = `ws://localhost:80`;
    this.app = this.getApp(options);
    this.standalone = this.app.name === options.deviceId;
    this.db = this.app.database();
    this.isOfflineMode = options.mode === StreamingModes.OFFLINE;
  }

  private getApp(options: NotionOptions) {
    const { deviceId } = options;
    const moduleApps = firebase.apps;

    const neurosityApp = [...moduleApps].find(
      (app: any) =>
        app.name === "[DEFAULT]" &&
        this.databaseURL === onlineConfig.databaseURL
    );

    const offlineConfig = {
      ...onlineConfig,
      databaseURL: this.databaseURL
    };

    const selectedConfig =
      options.mode === StreamingModes.OFFLINE
        ? offlineConfig
        : onlineConfig;

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
        : firebase.initializeApp(selectedConfig, notionAppName);
    }

    return firebase.initializeApp(selectedConfig);
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
