import FirebaseClient from "./clients/firebase";
import WebSocketClient from "./clients/websocket";

export default class BosClient {
  cosntructor (options = {}) {
    this.client = options.cloud
      ? new FirebaseClient(options)
      : new WebSocketClient(options);

    if (options.autoConnect) {
      this.connect();
    }
  }

  on (...args) {
    this.client.on(...args);
  }

  emit (...args) {
    this.client.emit(...args);
  }

  async connect (callback) {
    this.client.connect(() => {
      if (callback) {
        callback();
      }
      await Promise.resolve();
    });
  }

  async disconnect (callback) {
    this.client.disconnect(() => {
      if (callback) {
        callback();
      }
      await Promise.resolve();
    });
  }
}
