import firebase from "firebase/app";
import "firebase/database";
import "firebase/auth";
import "firebase/functions";
import "firebase/firestore";

import { config } from "./config";
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
  public authURL: string;

  constructor(options: NotionOptions) {
    this.app = this.getApp(options);
    this.standalone = this.app.name === options.deviceId;
    this.db = this.app.database();
    this.isOfflineMode = options.mode === StreamingModes.OFFLINE;
    this.databaseURL = options.databaseURL;
    this.authURL = options.authURL;

    if (this.isOfflineMode) {
      const { hostname, port } = new URL(options.databaseURL);
      this.db.useEmulator(hostname, Number(port));
    }
  }

  private getApp(options: NotionOptions) {
    const { deviceId } = options;
    const moduleApps = firebase.apps;

    const neurosityApp = [...moduleApps].find(
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
