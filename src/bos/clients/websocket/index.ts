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

  public onMetric(metric, callback) {
    this.socket.on(`metric/${metric}`, callback);
  }

  public onStatusChange(callback) {
    this.socket.on("status", callback);
  }

  public subscribe(metric, ...props) {
    this.socket.emit("metric/subscribe", { metric, props });
  }

  public unsubscribe(metric) {
    this.socket.emit("metric/unsubscribe", { metric });
  }

  public connect() {
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  public disconnect() {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }
}
