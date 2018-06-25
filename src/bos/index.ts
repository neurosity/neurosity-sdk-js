import FirebaseClient from "./clients/firebase/index";
import WebSocketClient from "./clients/websocket/index";
import IBosClient from "./client.i";
import IOptions from "../options.i";

export default class BosClient implements IBosClient {
  
  options: IOptions;
  client;
  
  constructor(options?: IOptions) {
    this.options = { ...options };

    this.client = this.options.cloud
      ? new FirebaseClient(this.options)
      : new WebSocketClient(this.options);

    this.init();
  }

  private init() {
    if (this.options.autoConnect) {
      this.connect();
    }
  }

  public on(...args) {
    this.client.on(...args);
  }

  public emit(...args) {
    this.client.emit(...args);
  }

  public async connect(callback?) {
    this.client.connect();
    if (callback) {
      callback();
    }
    await Promise.resolve();
  }

  public async disconnect(callback?) {
    this.client.disconnect();
    if (callback) {
      callback();
    }
    await Promise.resolve();
  }
}
