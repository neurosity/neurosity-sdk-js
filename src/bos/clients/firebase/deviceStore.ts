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

  const once = async namespace => {
    const snapshot = await deviceRef.child(namespace).once("value");
    return snapshot.val();
  };

  // Remove clients on disconnect
  deviceRef
    .child(`metrics/${clientId}`)
    .onDisconnect()
    .remove();

  deviceRef
    .child(`subscriptions/${clientId}`)
    .onDisconnect()
    .remove();

  return {
    getInfo: async () => {
      return await once("info");
    },
    onStatus: callback => {
      on("status", callback);
    },
    onMetric: (metric, callback) => {
      on(`metrics/${clientId}/${metric}`, data => {
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
