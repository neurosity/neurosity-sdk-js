import firebase from "@firebase/app";
import "@firebase/database";
import "@firebase/auth";
import { defaultConfig, configProps } from "./config";

import IDevice from "./device.i";

const { apps, initializeApp } = firebase;

export const getFirebaseConfig = (options = {}) =>
  Object.entries({ ...defaultConfig, ...options })
    .filter(([key]) => configProps.includes(key))
    .reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: value
      }),
      {}
    );

export const createDeviceStore = (deviceId, clientId) => {
  const deviceRef = firebase.database().ref(`devices/${deviceId}`);

  const set = (namespace, payload) => {
    deviceRef.child(namespace).set(payload);
  };

  const update = (namespace, payload) => {
    deviceRef.child(namespace).update(payload);
  };

  const on = (namespace, callback) => {
    deviceRef.child(namespace).on("value", snapshot => {
      callback(snapshot.val());
    });
  };

  return {
    init: () => {
      set(`clients/${clientId}`, {
        metrics: {},
        subscriptions: {}
      });
    },
    onStatus: callback => {
      on("status", callback)
    },
    onMetric: (metric, callback) => {
      on(`clients/${clientId}/metrics/${metric}`, data => {
        if (data !== null) {
          callback(data);
        }
      });
    },
    subscribeToMetric: metric => {
      update(`clients/${clientId}/subscriptions`, {
        [metric]: true
      });
    },
    unsubscribFromMetric: metric => {
      update(`clients/${clientId}/subscriptions`, {
        [metric]: false
      });
    },
    unsubscribeAllMetrics: () => {
      set(`clients/${clientId}/subscriptions`, null);
    }
  };
};

export default class FirebaseClient {
  user;
  deviceStore;

  constructor(options) {
    this.init(options);
  }

  private init (options) {
    if (!apps.length) {
      initializeApp(getFirebaseConfig(options || {}));
    }

    this.deviceStore = createDeviceStore(options.deviceId, "client1");
    this.deviceStore.init();

    firebase.auth().signInAnonymously();
    firebase.auth().onAuthStateChanged(user => {
      this.user = user;
    });
  }

  public onMetric(metric, callback) {
    this.deviceStore.onMetric(metric, callback);
  }

  public onStatusChange(callback) {
    this.deviceStore.onStatus(callback);
  }

  // @TODO: support setting props
  public subscribe(metric, ...props) {
    this.deviceStore.subscribeToMetric(metric);
  }

  public unsubscribe(metric) {
    this.deviceStore.unsubscribFromMetric(metric);
  }

  public connect() {
    
  }

  public disconnect() {
    this.deviceStore.unsubscribeAllMetrics();
  }
}
