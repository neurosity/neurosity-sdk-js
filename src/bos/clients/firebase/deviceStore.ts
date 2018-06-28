import firebase from "@firebase/app";
import "@firebase/database";

const { database } = firebase;

export interface IDevice {
  info: any;
  status: any;
  subscriptions: any;
  metrics: any;
}

export const createClient = rootRef => {
  const client = rootRef.child("clients").push();

  // Remove client on disconnect
  client.onDisconnect().remove();

  return {
    clientId: client.key,
    metricsRef: client.child("metrics"),
    subscriptionsRef: client.child("subscriptions")
  };
};

export const createDeviceStore = deviceId => {
  const deviceRef = database().ref(`devices/${deviceId}`);
  const { metricsRef, subscriptionsRef } = createClient(deviceRef);

  return {
    onStatus: callback => {
      deviceRef.child("status").on("value", snapshot => {
        callback(snapshot.val());
      });
    },
    onMetric: (metric, callback) => {
      metricsRef.child(metric).on("value", snapshot => {
        const data = snapshot.val();
        if (data !== null) {
          callback(data);
        }
      });
    },
    subscribeToMetric: metric => {
      subscriptionsRef.update({
        [metric]: true
      });
    },
    unsubscribFromMetric: metric => {
      subscriptionsRef.update({
        [metric]: false
      });
    }
  };
};
