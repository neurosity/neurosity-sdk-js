import io from "socket.io-client";

import { defaultConfig } from "./config";
import IClient from "../../client.i";
import IActions from "../../actions.i";

export default class WebSocketClient implements IClient {
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

  get actions(): IActions {
    return {
      on(callback) {

      },
      dispatch(action) {

      }
    };
  }

  public async getInfo() {

  }

  public onMetric(metric, callback) {
    this.socket.on(`metric/${metric}`, callback);
  }

  public subscribe(metric, ...labels) {
    this.socket.emit("metric/subscribe", { metric, labels });
  }

  public unsubscribe(metric) {
    this.socket.emit("metric/unsubscribe", { metric });
  }

  public async connect() {
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  public async disconnect() {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }
}
