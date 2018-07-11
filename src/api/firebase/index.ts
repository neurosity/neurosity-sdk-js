import firebase from "@firebase/app";
import "@firebase/auth";

import { getFirebaseConfig } from "./config";
import { createDeviceStore, TIMESTAMP } from "./deviceStore";
import IClient from "../client.i";
import IActions from "../actions.i";
import IMetrics from "../metrics.i";

const { apps, initializeApp, auth } = firebase;

/**
 * @hidden
 */
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

  public get actions(): IActions {
    return {
      dispatch: action => {
        this.deviceStore.dispatchAction(action);
      }
    };
  }

  public async connect() {}

  public async disconnect() {}

  public async getInfo() {
    return await this.deviceStore.getInfo();
  }

  public get metrics(): IMetrics {
    return {
      /**
       * Listens for metrics in path:
       * /devices/:deviceId/metrics/:clientId/:subscriptionId
       */
      on: (subscriptionId, callback) => {
        this.deviceStore.onMetric(subscriptionId, callback);
      },
      /**
       * Creates a new and unique subscription in path:
       * /devices/:deviceId/subscriptions/:clientId/:subscriptionId
       * E.g. /devices/device1/subscriptions/client2/subscription3
       * 
       * @param metric
       * @param label
       * @returns subscriptionId
       */
      subscribe: (metric, label) => {
        const subscriptionId = this.deviceStore.subscribeToMetric(metric, label);
        return subscriptionId;
      },
      /**
       * Removes subscription in path:
       * /devices/:deviceId/subscriptions/:clientId/:subscriptionId
       * 
       * @param metric
       * @param subscriptionId
       */
      unsubscribe: subscriptionId => {
        this.deviceStore.unsubscribFromMetric(subscriptionId);
      }
    };
  }

  public get timestamp(): any {
    return TIMESTAMP;
  }
}
