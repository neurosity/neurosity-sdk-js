import io from "socket.io-client";

/**
 * @hidden
 */
export default class WebSocketClient {
  public serverType: string = "websocket";
  protected socket;
  options;

  constructor(options) {
    this.socket = io(options.socketUrl, {
      autoConnect: true,
      path: `/${options.deviceId}`
    });

    this.init();
  }

  public onMetric(subscriptionId, callback) {
    this.socket.on(`metrics/${subscriptionId}`, callback);
  }

  private init() {
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  private disconnect() {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }
}
