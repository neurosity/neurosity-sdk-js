import io from "socket.io-client";
import { defaultConfig } from "./config";

export default class WebSocketClient {

  options;
  socket;

  constructor(options) {
    this.options = {
      ...defaultConfig,
      ...options
    };

    this.socket = io(this.options.socketUrl, {
      autoConnect: this.options.autoConnect,
      path: `/${this.options.deviceId}`
    });
  }

  on(type, callback) {
    this.socket.on(type, callback);
  }

  emit(type, ...payload) {
    this.socket.emit(type, payload);
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
