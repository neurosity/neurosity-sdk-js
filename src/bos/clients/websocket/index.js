import io from "socket.io-client";
import { defaultConfig } from "./config";

export default class WebSocketClient {
  constructor(options = {}) {
    this.options = {
      ...defaultConfig,
      ...options
    };

    this.socket = io(this.options.socketUrl, {
      autoConnect: this.options.autoConnect,
      path: `/${this.options.deviceId}`
    });
  }

  on(...args) {
    this.socket.on(...args);
  }

  emit(...args) {
    this.socket.emit(...args);
  }

  connect() {
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  disconnect() {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }
}
