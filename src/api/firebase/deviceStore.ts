import {
  getDatabase,
  ref,
  child,
  push,
  set,
  update,
  remove,
  onValue,
  off,
  get,
  onDisconnect,
  serverTimestamp,
  DataSnapshot
} from "firebase/database";

export interface IDevice {
  info: any;
  status: any;
  subscriptions: any;
  metrics: any;
}

/**
 * @hidden
 */
export const createDeviceStore = (app, deviceId, subscriptionManager) => {
  const database = getDatabase(app);
  const deviceRef = ref(database, `devices/${deviceId}`);
  const subscriptionsRef = child(deviceRef, "subscriptions");
  const clientId = push(subscriptionsRef).key;
  const clientRef = child(deviceRef, `clients/${clientId}`);
  let listenersToRemove = [];

  const setData = (namespace, payload) => {
    const namespaceRef = child(deviceRef, namespace);
    return set(namespaceRef, payload);
  };

  const pushData = (namespace, payload) => {
    const namespaceRef = child(deviceRef, namespace);
    return push(namespaceRef, payload);
  };

  const updateData = (namespace, payload) => {
    const namespaceRef = child(deviceRef, namespace);
    return update(namespaceRef, payload);
  };

  const onData = (eventType: any = "value", namespace, callback) => {
    const namespaceRef = child(deviceRef, namespace);
    const unsubscribe = onValue(namespaceRef, (snapshot) => {
      callback(snapshot.val(), snapshot);
    });

    listenersToRemove.push(unsubscribe);

    return unsubscribe;
  };

  const offData = (namespace, eventType, listener?) => {
    const namespaceRef = child(deviceRef, namespace);
    if (listener) {
      listener(); // listener is the unsubscribe function
    } else {
      off(namespaceRef);
    }
  };

  const onceData = async (namespace, eventType = "value") => {
    const namespaceRef = child(deviceRef, namespace);
    const snapshot = await get(namespaceRef);
    return snapshot.val();
  };

  const removeData = (namespace) => {
    const namespaceRef = child(deviceRef, namespace);
    remove(namespaceRef);
  };

  const bindListener = (
    eventType: string,
    namespace: string,
    callback: (res: any) => void,
    overrideResponse?: any
  ) => {
    onData(eventType, namespace, (data) => {
      if (data !== null) {
        offData(namespace, eventType);
        const response = overrideResponse ? overrideResponse : data;
        callback(response);
      }
    });
  };

  const lastOfChildValue = async (namespace, key, value) => {
    // Note: This needs to be implemented with query functions in modular SDK
    // For now, we'll use a simpler approach that gets all data and filters locally
    const namespaceRef = child(deviceRef, namespace);
    const snapshot = await get(namespaceRef);
    const results = snapshot.val() || {};

    // Filter results locally to match the query
    const filteredResults = Object.values(results).filter(
      (item: any) => item?.[key] === value
    );
    return filteredResults.length > 0
      ? filteredResults[filteredResults.length - 1]
      : null;
  };

  // Add client connections and subscriptions to db and remove them when offline
  const connectedRef = ref(database, ".info/connected");
  const connectedListener = onValue(connectedRef, (snapshot) => {
    if (!snapshot.val()) {
      return;
    }

    const clientOnDisconnect = onDisconnect(clientRef);
    clientOnDisconnect.remove().then(() => {
      set(clientRef, serverTimestamp());

      // NOTION-115: Re-subscribe when internet connection is lost and regained
      updateData("subscriptions", subscriptionManager.get()).then(() => {
        subscriptionManager.toList().forEach((subscription) => {
          const childPath = `subscriptions/${subscription.id}`;
          const subscriptionRef = child(deviceRef, childPath);
          const subscriptionOnDisconnect = onDisconnect(subscriptionRef);
          subscriptionOnDisconnect.remove();
        });
      });
    });
  });

  listenersToRemove.push(() => {
    connectedListener(); // Call the unsubscribe function
  });

  return {
    set: setData,
    once: onceData,
    update: updateData,
    lastOfChildValue,
    onNamespace: (namespace: string, callback: Function): Function => {
      return onData("value", namespace, (data: any) => {
        callback(data);
      });
    },
    offNamespace: (namespace: string, listener: Function): void => {
      offData(namespace, "value", listener);
    },
    dispatchAction: async (action) => {
      const snapshot = await pushData("actions", action);
      const actionId = snapshot.key;
      const actionPath = `actions/${actionId}`;

      const actionRef = child(deviceRef, actionPath);
      const actionOnDisconnect = onDisconnect(actionRef);
      actionOnDisconnect.remove();

      if (action.responseRequired) {
        const responseTimeout = action.responseTimeout || 600000; // defaults to 10 minutes
        const timeout = new Promise((_, reject) => {
          const id = setTimeout(() => {
            clearTimeout(id);
            remove(actionRef);
            reject(`Action response timed out in ${responseTimeout}ms.`);
          }, responseTimeout);
        });

        const response = new Promise((resolve) => {
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
      setData(`metrics/${metricName}`, metricValue);
    },
    onMetric: (subscription, callback: Function) => {
      const { atomic, metric, labels } = subscription;
      const child = atomic
        ? `metrics/${metric}`
        : `metrics/${metric}/${labels[0]}`;
      return onData("value", child, (data) => {
        if (data !== null) {
          callback(data);
        }
      });
    },
    subscribeToMetric: (subscription) => {
      const subscriptionsRef = child(deviceRef, "subscriptions");
      const id = push(subscriptionsRef).key;
      const childPath = `subscriptions/${id}`;
      const subscriptionCreated = {
        id,
        clientId,
        ...subscription
      };
      setData(childPath, subscriptionCreated);

      const subscriptionRef = child(deviceRef, childPath);
      const subscriptionOnDisconnect = onDisconnect(subscriptionRef);
      subscriptionOnDisconnect.remove();

      return subscriptionCreated;
    },
    unsubscribeFromMetric: (subscription) => {
      removeData(`subscriptions/${subscription.id}`);
    },
    removeMetricListener(subscription, listener: Function) {
      const { atomic, metric, labels } = subscription;
      const child = atomic
        ? `metrics/${metric}`
        : `metrics/${metric}/${labels[0]}`;
      offData(child, "value", listener);
    },
    disconnect() {
      remove(clientRef);
      listenersToRemove.forEach((removeListener) => {
        removeListener();
      });
      subscriptionManager
        .toList()
        .filter((subscription) => subscription.clientId === clientId)
        .forEach((subscription) => {
          const childPath = `subscriptions/${subscription.id}`;
          const subscriptionRef = child(deviceRef, childPath);
          remove(subscriptionRef);
        });
    }
  };
};
