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
  const clientId = deviceRef.child("subscriptions").push().key;

  const child = topic => {
    return deviceRef.child(topic);
  };

  const set = (topic, payload) => {
    return deviceRef.child(topic).set(payload);
  };

  const push = (topic, payload) => {
    return deviceRef.child(topic).push(payload);
  };

  const update = (topic, payload) => {
    deviceRef.child(topic).update(payload);
  };

  const on = (eventType: any = "value", topic, callback) => {
    return deviceRef.child(topic).on(eventType, snapshot => {
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

  const lastOfChildValue = async (topic, key, value) => {
    const snapshot = await deviceRef
      .child(topic)
      .orderByChild(key)
      .equalTo(value)
      .limitToLast(1)
      .once("value");
    const results = snapshot.val();
    const [match] = Object.values(results || {});
    return match || null;
  };

  return {
    once,
    lastOfChildValue,
    onStatus: async callback => {
      on("value", "status", data => {
        if (data !== null) {
          callback(data);
        }
      });
    },
    dispatchAction: async action => {
      const snapshot = await push("actions", action);
      const actionId = snapshot.key;
      const actionPath = `actions/${actionId}`;

      snapshot.onDisconnect().remove();

      if (action.responseRequired) {
        return new Promise((resolve, reject) => {
          const error = new Error("Action removed");
          bindListener("value", `${actionPath}/response`, resolve);
          bindListener("child_removed", actionPath, reject, error);
        });
      }

      return actionId;
    },
    nextMetric: async (
      metricName: string,
      metricValue: { [label: string]: any },
      serverType: string
    ) => {
      set(`metrics/${metricName}`, metricValue);
    },
    onMetric: (
      metricName: string,
      subscriptionId: string,
      callback: Function
    ) => {
      return on("value", `metrics/${metricName}`, data => {
        if (data !== null) {
          callback(data);
        }
      });
    },
    subscribeToMetric: subscription => {
      const id = deviceRef.child("subscriptions").push().key;
      const childPath = `subscriptions/${id}`;
      set(childPath, {
        id,
        clientId,
        ...subscription
      });

      deviceRef
        .child(childPath)
        .onDisconnect()
        .remove();

      return id;
    },
    unsubscribFromMetric: (
      subscriptionId: string,
      listener: Function
    ) => {
      off("value", listener);
      remove(`subscriptions/${subscriptionId}`);
    }
  };
};
