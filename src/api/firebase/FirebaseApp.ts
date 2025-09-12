import {
  initializeApp,
  getApps,
  FirebaseApp as FirebaseAppType,
  deleteApp
} from "firebase/app";
import {
  getDatabase,
  connectDatabaseEmulator,
  goOnline,
  goOffline
} from "firebase/database";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

import { config } from "./config";
import { SDKOptions } from "../../types/options";

/**
 * @hidden
 */
export class FirebaseApp {
  protected standalone: boolean;
  public app: FirebaseAppType;

  constructor(options: SDKOptions) {
    this.app = this.getApp(options.deviceId);
    this.standalone = this.app.name === options.deviceId;

    if (options.emulator) {
      this.connectEmulators(options);
    }
  }

  private getApp(deviceId?: string) {
    const moduleApps = getApps();
    const browserApps =
      typeof window !== "undefined" &&
      "firebase" in window &&
      "apps" in (window as any).firebase
        ? (window as any)["firebase"]["apps"]
        : [];

    const neurosityApp = [...moduleApps, ...(browserApps as any[])].find(
      (app: any) =>
        app.name === "[DEFAULT]" &&
        app.options.databaseURL === config.databaseURL
    );

    if (neurosityApp) {
      return neurosityApp;
    }

    if (deviceId) {
      const neurosityAppName = deviceId;
      const neurosityApp = moduleApps.find(
        (app) => app.name === neurosityAppName
      );
      return neurosityApp
        ? neurosityApp
        : initializeApp(config, neurosityAppName);
    }

    return initializeApp(config);
  }

  connectEmulators(options: SDKOptions) {
    const {
      emulatorHost,
      emulatorAuthPort,
      emulatorDatabasePort,
      emulatorFunctionsPort,
      emulatorFirestorePort,
      emulatorOptions
    } = options;

    const auth = getAuth(this.app);
    const database = getDatabase(this.app);
    const functions = getFunctions(this.app);
    const firestore = getFirestore(this.app);

    connectAuthEmulator(auth, `http://${emulatorHost}:${emulatorAuthPort}`);
    connectDatabaseEmulator(database, emulatorHost, emulatorDatabasePort);
    connectFunctionsEmulator(functions, emulatorHost, emulatorFunctionsPort);
    connectFirestoreEmulator(firestore, emulatorHost, emulatorFirestorePort);
  }

  goOnline() {
    const database = getDatabase(this.app);
    goOnline(database);
  }

  goOffline() {
    const database = getDatabase(this.app);
    goOffline(database);
  }

  public disconnect(): Promise<any> {
    if (this.standalone) {
      return deleteApp(this.app);
    }
    return Promise.resolve();
  }
}
