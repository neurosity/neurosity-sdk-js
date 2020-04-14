import io from "socket.io-client";
import { Subscription } from "../../types/subscriptions";

/**
 * @hidden
 */
type WebsocketOptions = {
  deviceId: string;
  socketUrl?: string;
  secure?: boolean;
};

const defaultOptions = {
  secure: true
};

/**
 * @hidden
 */
export class WebsocketClient {
  static serverType: string = "websocket";
  private options: WebsocketOptions;
  protected socket;

  constructor(options: WebsocketOptions) {
    this.options = Object.freeze({
      ...defaultOptions,
      ...options
    });

    this.socket = io(this.options.socketUrl, {
      path: `/${this.options.deviceId}`
    });
  }

  public onMetric(
    subscription: Subscription,
    callback: Function
  ): Function {
    return this.socket.on(`metrics/${subscription.id}`, callback);
  }

  public removeMetricListener(
    subscription: Subscription,
    listener: Function
  ): void {
    this.socket.off(`metrics/${subscription.id}`, listener);
  }

  public disconnect(): void {
    this.socket.removeAllListeners();
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }
}
