import io from "socket.io-client";

/**
 * @hidden
 */
export class WebsocketClient {
  static serverType: string = "websocket";
  protected socket;
  options;

  constructor(options) {
    this.socket = io(options.socketUrl, {
      path: `/${options.deviceId}`
    });

    this.init();
  }

  public onMetric(subscription, callback) {
    return this.socket.on(`metrics/${subscription.id}`, callback);
  }

  public removeMetricListener(subscription, listener): void {
    this.socket.off(`metrics/${subscription.id}`, listener);
  }

  private init(): void {
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  public disconnect(): void {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }
}
