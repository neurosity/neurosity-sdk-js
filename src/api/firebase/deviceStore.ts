export interface IDevice {
  info: any;
  status: any;
  subscriptions: any;
  metrics: any;
}

/**
 * @hidden
 */
export const createDeviceStore = (
  app,
  deviceId,
  SERVER_TIMESTAMP,
  subscriptionManager
) => {
  const deviceRef = app.database().ref(`devices/${deviceId}`);
  const clientId = deviceRef.child("subscriptions").push().key;
  const clientRef = deviceRef.child(`clients/${clientId}`);

  const child = namespace => {
    return deviceRef.child(namespace);
  };

  const set = (namespace, payload) => {
    return deviceRef.child(namespace).set(payload);
  };

  const push = (namespace, payload) => {
    return deviceRef.child(namespace).push(payload);
  };

  const update = (namespace, payload) => {
    return deviceRef.child(namespace).update(payload);
  };

  const on = (eventType: any = "value", namespace, callback) => {
    return deviceRef.child(namespace).on(eventType, snapshot => {
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

  const once = async (namespace, eventType = "value") => {
    const snapshot = await deviceRef.child(namespace).once(eventType);
    return snapshot.val();
  };

  const remove = namespace => {
    deviceRef.child(namespace).remove();
  };

  const bindListener = (
    eventType: string,
    namespace: string,
    callback: (res: any) => void,
    overrideResponse?: any
  ) => {
    on(eventType, namespace, data => {
      if (data !== null) {
        off(namespace, eventType);
        const response = overrideResponse ? overrideResponse : data;
        callback(response);
      }
    });
  };

  const lastOfChildValue = async (namespace, key, value) => {
    const snapshot = await deviceRef
      .child(namespace)
      .orderByChild(key)
      .equalTo(value)
      .limitToLast(1)
      .once("value");
    const results = snapshot.val();
    const [match] = Object.values(results || {});
    return match || null;
  };

  // Add client connections and subscriptions to db and remove them when offline
  app
    .database()
    .ref(".info/connected")
    .on("value", snapshot => {
      if (!snapshot.val()) {
        return;
      }

      clientRef
        .onDisconnect()
        .remove()
        .then(() => {
          clientRef.set(SERVER_TIMESTAMP);

          // NOTION-115: Re-subscribe when internet connection is lost and regained
          update("subscriptions", subscriptionManager.get()).then(
            () => {
              subscriptionManager.toList().forEach(subscription => {
                const childPath = `subscriptions/${subscription.id}`;
                deviceRef
                  .child(childPath)
                  .onDisconnect()
                  .remove();
              });
            }
          );
        });
    });

  return {
    set,
    once,
    update,
    lastOfChildValue,
    onNamespace: (namespace: string, callback: Function): Function => {
      return on("value", namespace, (data: any) => {
        callback(data);
      });
    },
    offNamespace: (namespace: string, listener: Function): void => {
      off(namespace, "value", listener);
    },
    dispatchAction: async action => {
      const snapshot = await push("actions", action);
      const actionId = snapshot.key;
      const actionPath = `actions/${actionId}`;

      snapshot.onDisconnect().remove();

      if (action.responseRequired) {
        const responseTimeout = action.responseTimeout || 600000; // defaults to 10 minutes
        const timeout = new Promise((_, reject) => {
          const id = setTimeout(() => {
            clearTimeout(id);
            snapshot.remove();
            reject(
              `Action response timed out in ${responseTimeout}ms.`
            );
          }, responseTimeout);
        });

        const response = new Promise(resolve => {
          bindListener("value", `${actionPath}/response`, resolve);
        });

        return Promise.race([response, timeout]);
      }

      return actionId;
    },
    nextMetric: async (
      metricName: string,
      metricValue: { [label: string]: any }
    ) => {
      set(`metrics/${metricName}`, metricValue);
    },
    onMetric: (subscription, callback: Function) => {
      const { atomic, metric, labels } = subscription;
      const child = atomic
        ? `metrics/${metric}`
        : `metrics/${metric}/${labels[0]}`;
      return on("value", child, data => {
        if (data !== null) {
          callback(data);
        }
      });
    },
    subscribeToMetric: subscription => {
      const id = deviceRef.child("subscriptions").push().key;
      const childPath = `subscriptions/${id}`;
      const subscriptionCreated = {
        id,
        clientId,
        ...subscription
      };
      set(childPath, subscriptionCreated);

      deviceRef
        .child(childPath)
        .onDisconnect()
        .remove();

      return subscriptionCreated;
    },
    unsubscribeFromMetric: subscription => {
      remove(`subscriptions/${subscription.id}`);
    },
    removeMetricListener(subscription, listener: Function) {
      const { atomic, metric, labels } = subscription;
      const child = atomic
        ? `metrics/${metric}`
        : `metrics/${metric}/${labels[0]}`;
      off(child, "value", listener);
    }
  };
};
