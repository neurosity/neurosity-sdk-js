export interface IDevice {
  info: any;
  status: any;
  subscriptions: any;
  metrics: any;
}

/**
 * @hidden
 */
export const createDeviceStore = (app, deviceId) => {
  const deviceRef = app.database().ref(`devices/${deviceId}`);
  const clientId =
    "client" + deviceRef.child("subscriptions").push().key;

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

  const off = (childName, eventType, listener?) => {
    if (listener) {
      deviceRef.child(childName).off(eventType, listener);
    } else {
      deviceRef.child(childName).off(eventType);
    }
  };

  const once = async topic => {
    const snapshot = await deviceRef.child(topic).once("value");
    return snapshot.val();
  };

  const remove = topic => {
    deviceRef.child(topic).remove();
  };

  const bindListener = (
    eventType: string,
    topic: string,
    callback: (res: any) => void,
    overrideResponse?: any
  ) => {
    on(eventType, topic, data => {
      if (data !== null) {
        off(topic, eventType);
        const response = overrideResponse ? overrideResponse : data;
        callback(response);
      }
    });
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
    onStatus: async callback => {
      on("value", "status", data => {
        if (data !== null) {
          callback(data);
        }
      });
    },
    dispatchAction: async action => {
      const actionId = child("actions").push().key;
      const actionPath = `actions/${actionId}`;
      await set(actionPath, action);

      if (action.responseRequired) {
        return new Promise((resolve, reject) => {
          const error = new Error("Action removed");
          bindListener("value", `${actionPath}/response`, resolve);
          bindListener("child_removed", actionPath, reject, error);
        });
      }

      return Promise.resolve();
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
      remove(`metrics/${clientId}/${subscriptionId}`);
    }
  };
};
