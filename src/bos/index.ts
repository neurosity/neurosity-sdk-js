import FirebaseClient from "./clients/firebase/index";
import WebSocketClient from "./clients/websocket/index";
import IClient from "./client.i";
import IActions from "./actions.i";
import IOptions from "../options.i";

export default class BosClient implements IClient {
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

  get actions(): IActions {
    return this.client.actions;
  }

  public async getInfo() {
    return await this.client.getInfo();
  }

  public onMetric(metric, calback) {
    this.client.onMetric(metric, calback);
  }

  public subscribe(metric, ...labels) {
    this.client.subscribe(metric, ...labels);
  }

  public unsubscribe(metric) {
    this.client.unsubscribe(metric);
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
