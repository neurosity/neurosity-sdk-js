import io from "socket.io-client";

import { defaultConfig } from "./config";
import IClient from "../client.d";
import IActions from "../actions.d";
import IMetrics from "../metrics.d";

/**
 * @hidden
 */
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
  
  public onStatus() {}

  public get metrics(): IMetrics {
    return {
      on: (subscriptionId, callback) => {},
      subscribe: subscription => {
        const subscriptionId = "";
        return subscriptionId;
      },
      unsubscribe: subscriptionId => {}
    };
  }

  public get timestamp(): number {
    return Date.now();
  }
}
