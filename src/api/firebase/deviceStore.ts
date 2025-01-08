import firebase from "firebase/app";
import { DeviceInfo } from "../../types/deviceInfo";
import { STATUS } from "../../types/status";
import { Metrics } from "../../types/metrics";

type EventType =
  | "value"
  | "child_added"
  | "child_changed"
  | "child_removed"
  | "child_moved";

type _DeviceState = {
  info: DeviceInfo;
  status: typeof STATUS;
  metrics: Metrics;
  settings: Record<string, unknown>;
};

type DeviceAction = {
  type: string;
  payload: unknown;
  responseRequired?: boolean;
  responseTimeout?: number;
};

interface Subscription {
  id: string;
  clientId: string;
  atomic: boolean;
  metric: string;
  labels: string[];
}

interface SubscriptionManager {
  get: () => Record<string, unknown>;
  toList: () => Subscription[];
}

interface DeviceStore {
  set: (namespace: string, payload: unknown) => Promise<void>;
  push: (
    namespace: string,
    payload: unknown
  ) => firebase.database.ThenableReference;
  update: (
    namespace: string,
    payload: Record<string, unknown>
  ) => Promise<void>;
  once: (namespace: string, eventType?: EventType) => Promise<unknown>;
  remove: (namespace: string) => Promise<void>;
  disconnect: () => void;
  onNamespace: (namespace: string, callback: (data: unknown) => void) => void;
  offNamespace: (namespace: string, listener: (data: unknown) => void) => void;
  dispatchAction: (action: DeviceAction) => Promise<unknown>;
  nextMetric: (
    metricName: string,
    metricValue: Record<string, unknown>
  ) => Promise<void>;
  onMetric: (
    subscription: Subscription,
    callback: (data: unknown) => void
  ) => void;
  subscribeToMetric: (subscription: Subscription) => Subscription;
  unsubscribeFromMetric: (subscription: Subscription) => void;
  removeMetricListener: (
    subscription: Subscription,
    listener: (data: unknown) => void
  ) => void;
}

export const createDeviceStore = (
  app: firebase.app.App,
  deviceId: string,
  _subscriptionManager: SubscriptionManager
): DeviceStore => {
  const deviceRef = app.database().ref(`devices/${deviceId}`);
  const clientId = deviceRef.child("subscriptions").push().key;
  const clientRef = deviceRef.child(`clients/${clientId}`);
  const listenersToRemove: Array<() => void> = [];

  const set = (namespace: string, payload: unknown): Promise<void> => {
    return deviceRef.child(namespace).set(payload);
  };

  const push = (
    namespace: string,
    payload: unknown
  ): firebase.database.ThenableReference => {
    return deviceRef.child(namespace).push(payload);
  };

  const update = (
    namespace: string,
    payload: Record<string, unknown>
  ): Promise<void> => {
    return deviceRef.child(namespace).update(payload);
  };

  const on = (
    eventType: EventType = "value",
    namespace: string,
    callback: (data: unknown, snapshot: firebase.database.DataSnapshot) => void
  ) => {
    const listener = deviceRef.child(namespace).on(eventType, (snapshot) => {
      callback(snapshot.val(), snapshot);
    });

    listenersToRemove.push(() => {
      deviceRef.child(namespace).off(eventType, listener);
    });

    return listener;
  };

  const off = (
    namespace: string,
    eventType: EventType,
    listener?: (
      a: firebase.database.DataSnapshot | null,
      b?: string | null
    ) => unknown
  ): void => {
    if (listener) {
      deviceRef.child(namespace).off(eventType, listener);
    } else {
      deviceRef.child(namespace).off(eventType);
    }
  };

  const once = async (
    namespace: string,
    eventType: EventType = "value"
  ): Promise<unknown> => {
    const snapshot = await deviceRef.child(namespace).once(eventType);
    return snapshot.val();
  };

  const remove = (namespace: string): Promise<void> => {
    return deviceRef.child(namespace).remove();
  };

  const disconnect = (): void => {
    clientRef.remove();
    listenersToRemove.forEach((removeListener) => {
      removeListener();
    });
  };

  const onNamespace = (
    namespace: string,
    callback: (data: unknown) => void
  ): void => {
    on("value", namespace, callback);
  };

  const offNamespace = (
    namespace: string,
    listener: (data: unknown) => void
  ): void => {
    off(namespace, "value", listener);
  };

  const dispatchAction = async (action: DeviceAction): Promise<unknown> => {
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
          reject(`Action response timed out in ${responseTimeout}ms.`);
        }, responseTimeout);
      });

      const response = new Promise((resolve) => {
        on("value", `${actionPath}/response`, resolve);
      });

      return Promise.race([response, timeout]);
    }

    return actionId;
  };

  const nextMetric = async (
    metricName: string,
    metricValue: Record<string, unknown>
  ): Promise<void> => {
    await set(`metrics/${metricName}`, metricValue);
  };

  const onMetric = (
    subscription: Subscription,
    callback: (data: unknown) => void
  ): void => {
    const { atomic, metric, labels } = subscription;
    const child = atomic
      ? `metrics/${metric}`
      : `metrics/${metric}/${labels[0]}`;
    on("value", child, callback);
  };

  const subscribeToMetric = (subscription: Subscription): Subscription => {
    const subscriptionId = deviceRef.child("subscriptions").push().key;
    if (!subscriptionId || !clientId) {
      throw new Error("Failed to generate subscription ID");
    }
    const childPath = `subscriptions/${subscriptionId}`;
    const subscriptionCreated = {
      ...subscription,
      id: subscriptionId,
      clientId
    };
    set(childPath, subscriptionCreated);
    deviceRef.child(childPath).onDisconnect().remove();
    return subscriptionCreated;
  };

  const unsubscribeFromMetric = (subscription: Subscription): void => {
    remove(`subscriptions/${subscription.id}`);
  };

  const removeMetricListener = (
    subscription: Subscription,
    listener: (data: unknown) => void
  ): void => {
    const { atomic, metric, labels } = subscription;
    const child = atomic
      ? `metrics/${metric}`
      : `metrics/${metric}/${labels[0]}`;
    off(child, "value", listener);
  };

  return {
    set,
    push,
    update,
    once,
    remove,
    disconnect,
    onNamespace,
    offNamespace,
    dispatchAction,
    nextMetric,
    onMetric,
    subscribeToMetric,
    unsubscribeFromMetric,
    removeMetricListener
  };
};
