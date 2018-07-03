import io from "socket.io-client";

import { defaultConfig } from "./config";
import IClient from "../client.i";
import IActions from "../actions.i";
import IMetrics from "../metrics.i";

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

  public get actions(): IActions {
    return {
      dispatch(action) {}
    };
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

  public async getInfo() {}

  public get metrics(): IMetrics {
    return {
      on: (metric, callback) => {},
      // @TODO: support setting labels
      subscribe: (metric, ...labels) => {},
      unsubscribe: metric => {}
    };
  }
}
