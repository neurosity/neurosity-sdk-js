import firebase from "@firebase/app";
import "@firebase/database";

const { database } = firebase;

export interface IDevice {
  info: any;
  status: any;
  subscriptions: any;
  metrics: any;
}

export const TIMESTAMP = database.ServerValue.TIMESTAMP;

/**
 * @hidden
 */
export const createDeviceStore = deviceId => {
  const deviceRef = database().ref(`devices/${deviceId}`);
  const clientId = deviceRef.child("subscriptions").push().key;

  const topics = [
    "subscriptions",
    "metrics",
    "actions"
  ];

  const set = (topic, payload) => {
    deviceRef.child(topic).set(payload);
  };

  const push = (topic, payload) => {
    return deviceRef.child(topic).push(payload);
  };

  const update = (topic, payload) => {
    deviceRef.child(topic).update(payload);
  };

  const on = (eventType: any = "value", topic, callback) => {
    deviceRef.child(topic).on(eventType, snapshot => {
      callback(snapshot.val(), snapshot);
    });
  };

  const once = async topic => {
    const snapshot = await deviceRef.child(topic).once("value");
    return snapshot.val();
  };

  // Remove each client's topic on disconnect
  topics.forEach(topic => {
    deviceRef
      .child(`${topic}/${clientId}`)
      .onDisconnect()
      .remove();
  });

  return {
    getInfo: async () => {
      return await once("info");
    },
    dispatchAction: action => {
      push("actions", action);
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
