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

  const getCient = clientId => {
    set(`clients/${clientId}`, {
      metrics: {},
      subscriptions: {}
    });

    return {
      onMetric: (metric, callback) => {
        on(`clients/${clientId}/metrics/${metric}`, data => {
          if (data !== null) {
            callback(data);
          }
        });
      },
      subscribe: metric => {
        update(`clients/${clientId}/subscriptions`, {
          [metric]: true
        });
      },
      unsubscribe: metric => {
        update(`clients/${clientId}/subscriptions`, {
          [metric]: false
        });
      },
      unsubscribeAll: () => {
        set(`clients/${clientId}/subscriptions`, null);
      }
    };
  };

  return {
    on: on,
    once: deviceRef.once,
    update: update,
    set: set,
    client: getCient(clientId),
    setStatus: status => {
      set("status", status);
    },
    updateStatus: status => {
      update("status", status);
    },
    updateInfo: info => {
      update("info", info);
    },
    updateData: data => {
      update("data", data);
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

    firebase.auth().signInAnonymously();
    firebase.auth().onAuthStateChanged(user => {
      this.user = user;
    });
  }

  public onMetric(metric, callback) {
    this.deviceStore.client.onMetric(metric, callback);
  }

  public onStatusChange(callback) {
    this.deviceStore.on("status", callback);
  }

  // @TODO: support setting props
  public subscribe(metric, ...props) {
    this.deviceStore.client.subscribe(metric);
  }

  public unsubscribe(metric) {
    this.deviceStore.client.unsubscribe(metric);
  }

  public connect() {
    this.deviceStore.updateStatus({
      connected: true
    });
  }

  public disconnect() {
    this.deviceStore.updateStatus({
      connected: false
    });
    this.deviceStore.client.unsubscribeAll();
  }
}
