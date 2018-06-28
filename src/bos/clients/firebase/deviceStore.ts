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

  const createRef = namespace => {
    return deviceRef.child(namespace).push();
  };

  const on = (namespace, callback) => {
    deviceRef.child(namespace).on("value", snapshot => {
      callback(snapshot.val());
    });
  };

  const getClientRefs = () => ({
    metricsRef: createRef("metrics"),
    subscriptionsRef: createRef("subscriptions")
  });

  const { metricsRef, subscriptionsRef } = getClientRefs();

  subscriptionsRef.onDisconnect().remove();

  return {
    onStatus: callback => {
      on("status", callback);
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
