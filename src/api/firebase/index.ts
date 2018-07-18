import * as firebase from "firebase/app";
import "firebase/auth";

import { getFirebaseConfig } from "./config";
import { createDeviceStore, TIMESTAMP } from "./deviceStore";
import IClient from "../client.d";
import IActions from "../actions.d";
import IMetrics from "../metrics.d";

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
    if (!firebase.apps.length) {
      firebase.initializeApp(getFirebaseConfig(options || {}));
    }

    this.deviceStore = createDeviceStore(options.deviceId);

    firebase.auth().signInAnonymously();
    firebase.auth().onAuthStateChanged(user => {
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
       * @param subscription
       * @returns subscriptionId
       */
      subscribe: subscription => {
        const subscriptionId = this.deviceStore.subscribeToMetric(subscription);
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
