import FirebaseClient from "./clients/firebase/index";
import WebSocketClient from "./clients/websocket/index";
import IClient from "./client.i";
import IActions from "./actions.i";
import IMetrics from "./metrics.i";
import IOptions from "../options.i";

export default class ApiClient implements IClient {
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

  get actions(): IActions {
    return this.client.actions;
  }

  protected get client() {
    return this._client;
  }

  protected set client(client) {
    this._client = client;
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

  public async getInfo() {
    return await this.client.getInfo();
  }

  public get metrics(): IMetrics {
    return this.client.metrics;
  }
}
