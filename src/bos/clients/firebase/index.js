import { apps, database, initializeApp } from "firebase";
import { defaultConfig, configProps } from "./config";

export const getFirebaseConfig = (options = {}) =>
  Object.entries({ ...defaultConfig, ...options })
    .filter(([key]) => configProps.includes(key))
    .reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: value
      }),
      {}
    );

export const createDeviceStore = deviceId => {
  const deviceRef = database().ref(`devices/${deviceId}`);

  const set = (namespace, payload) => {
    deviceRef
      .child(namespace)
      .set(payload)
      .then(console.log, console.log);
  };
  const update = (namespace, payload) => {
    deviceRef
      .child(namespace)
      .update(payload)
      .then(console.log, console.log);
  };
  const on = (namespace, callback) => {
    deviceRef.child(namespace).on("value", snapshot => {
      callback(snapshot.val());
    });
  };
  const emit = (namespace, payload) => {
    deviceRef.child(namespace).set(payload);
  };
  return {
    on: on,
    emit: emit,
    once: deviceRef.once,
    update: update,
    set: set,
    setStatus: status => {
      set("status", status);
    },
    updateStatus: status => {
      update("status", status);
    },
    updateInfo: info => {
      update("info", info);
    },
    updateData: data => {
      update("data", data);
    }
  };
};

export default class FirebaseClient {
  constructor(options = {}) {
    if (!apps.length) {
      initializeApp(getFirebaseConfig(options));
    }
    this.deviceStore = createDeviceStore(options.deviceId);
  }

  on(...args) {
    this.deviceStore.on(...args);
  }

  emit(...args) {
    this.deviceStore.emit(...args);
  }

  connect() {
    this.deviceStore.updateStatus({
      connected: true
    });
  }

  disconnect() {
    this.deviceStore.updateStatus({
      connected: false
    });
  }
}
