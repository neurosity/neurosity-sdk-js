import * as firebase from "firebase/app";
import "firebase/database";

export interface IDevice {
  info: any;
  status: any;
  subscriptions: any;
  metrics: any;
}

export const TIMESTAMP = firebase.database.ServerValue.TIMESTAMP;

/**
 * @hidden
 */
export const createDeviceStore = deviceId => {
  const deviceRef = firebase.database().ref(`devices/${deviceId}`);
  const clientId = "client" + deviceRef.child("subscriptions").push().key;

  const topics = ["subscriptions", "metrics", "actions"];

  const child = topic => {
    return deviceRef.child(topic);
  };

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

  const remove = topic => {
    deviceRef.child(topic).remove();
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
    onMetric: (subscriptionId, callback) => {
      on("value", `metrics/${clientId}/${subscriptionId}`, data => {
        if (data !== null) {
          callback(data);
        }
      });
    },
    subscribeToMetric: subscription => {
      const subscriptionId =
        "subscription" + child(`subscriptions/${clientId}`).push().key;
      set(`subscriptions/${clientId}/${subscriptionId}`, subscription);
      return subscriptionId;
    },
    unsubscribFromMetric: subscriptionId => {
      remove(`subscriptions/${clientId}/${subscriptionId}`);
    }
  };
};
