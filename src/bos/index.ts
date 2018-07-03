import FirebaseClient from "./clients/firebase/index";
import WebSocketClient from "./clients/websocket/index";
import IClient from "./client.i";
import IActions from "./actions.i";
import IOptions from "../options.i";

export default class BosClient implements IClient {
  protected _client: IClient;

  constructor(options?: IOptions) {
    if (options.cloud) {
      this.client = new FirebaseClient(options);
    } else {
      this.client = new WebSocketClient(options);
    }

    this.init(options);
  }

  private init(options: IOptions) {
    if (options.autoConnect) {
      this.connect();
    }
  }

  protected get client() {
    return this._client;
  }

  protected set client(client) {
    this._client = client;
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
