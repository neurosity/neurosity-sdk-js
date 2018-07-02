import firebase from "@firebase/app";
import "@firebase/database";

const { database } = firebase;

export interface IDevice {
  info: any;
  status: any;
  subscriptions: any;
  metrics: any;
}

export const createDeviceStore = deviceId => {
  const deviceRef = database().ref(`devices/${deviceId}`);
  const clientId = deviceRef.child("subscriptions").push().key;

  const namespaces = [
    "subscriptions",
    "metrics",
    "actions"
  ];

  const set = (namespace, payload) => {
    deviceRef.child(namespace).set(payload);
  };

  const push = (namespace, payload) => {
    return deviceRef.child(namespace).push(payload);
  };

  const update = (namespace, payload) => {
    deviceRef.child(namespace).update(payload);
  };

  const on = (eventType: any = "value", namespace, callback) => {
    deviceRef.child(namespace).on(eventType, snapshot => {
      callback(snapshot.val(), snapshot);
    });
  };

  const once = async namespace => {
    const snapshot = await deviceRef.child(namespace).once("value");
    return snapshot.val();
  };

  // Remove each client's namespace on disconnect
  namespaces.forEach(namespace => {
    deviceRef
      .child(`${namespace}/${clientId}`)
      .onDisconnect()
      .remove();
  });

  return {
    getInfo: async () => {
      return await once("info");
    },
    onAction: callback => {
      on("child_added", `actions/${clientId}/client`, (action, snapshot) => {
        if (action !== null) {
          callback(action);
          snapshot.remove();
        }
      });
    },
    dispatchAction: action => {
      push(`actions/${clientId}/server`, action);
    },
    onMetric: (metric, callback) => {
      on("value", `metrics/${clientId}/${metric}`, data => {
        if (data !== null) {
          callback(data);
        }
      });
    },
    subscribeToMetric: metric => {
      update(`subscriptions/${clientId}`, {
        [metric]: true
      });
    },
    unsubscribFromMetric: metric => {
      update(`subscriptions/${clientId}`, {
        [metric]: false
      });
    }
  };
};
