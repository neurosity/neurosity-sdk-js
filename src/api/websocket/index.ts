import io from "socket.io-client";

/**
 * @hidden
 */
export class WebsocketClient {
  public serverType: string = "websocket";
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
