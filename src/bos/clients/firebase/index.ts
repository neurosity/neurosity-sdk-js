import firebase from "@firebase/app";
import "@firebase/auth";

import { getFirebaseConfig } from "./config";
import { createDeviceStore } from "./deviceStore";
import IClient from "../../client.i";
import IActions from "../../actions.i";

const { apps, initializeApp, auth } = firebase;

export default class FirebaseClient implements IClient {
  user;
  deviceStore;

  constructor(options) {
    this.init(options);
  }

  private init(options) {
    if (!apps.length) {
      initializeApp(getFirebaseConfig(options || {}));
    }

    this.deviceStore = createDeviceStore(options.deviceId);

    auth().signInAnonymously();
    auth().onAuthStateChanged(user => {
      this.user = user;
    });
  }
  
  get actions(): IActions {
    return {
      on: callback => {
        this.deviceStore.onAction(callback);
      },
      dispatch: action => {
        this.deviceStore.dispatchAction(action);
      }
    };
  }

  public async getInfo() {
    return await this.deviceStore.getInfo();
  }

  public onMetric(metric, callback) {
    this.deviceStore.onMetric(metric, callback);
  }

  // @TODO: support setting labels
  public subscribe(metric, ...labels) {
    this.deviceStore.subscribeToMetric(metric);
  }

  public unsubscribe(metric) {
    this.deviceStore.unsubscribFromMetric(metric);
  }

  public async connect() {}

  public async disconnect() {}
}
