import FirebaseClient from "./firebase/index";
import IClient from "./client.d";
import IActions from "./actions.d";
import IMetrics from "./metrics.d";
import IOptions from "../options.d";

/**
 * @hidden
 */
export default abstract class ApiClient implements IClient {
  protected firebase: FirebaseClient;
  protected options: IOptions;

  constructor(options: IOptions) {
    this.options = Object.freeze(options);
    this.firebase = new FirebaseClient(this.options);
  }

  public get actions(): IActions {
    return {
      dispatch: action => {
        this.firebase.dispatchAction(action);
      }
    };
  }

  public async getInfo(): Promise<any> {
    return await this.firebase.getInfo();
  }

  public onStatus(callback): void {
    this.firebase.onStatus(callback);
  }

  public get metrics(): IMetrics {
    return {
      on: (subscriptionId, callback): void => {
        const { websocket } = this.options;
        if (websocket) {
          websocket.onMetric(subscriptionId, callback);
        } else {
          this.firebase.onMetric(subscriptionId, callback);
        }
      },
      subscribe: (subscription): string => {
        const { websocket } = this.options;
        const serverType = websocket
          ? websocket.serverType
          : this.firebase.serverType;

        const subscriptionId = this.firebase.subscribeToMetric({
          ...subscription,
          serverType
        });
        return subscriptionId;
      },
      unsubscribe: (subscriptionId): void => {
        this.firebase.unsubscribFromMetric(subscriptionId);
      }
    };
  }

  public get timestamp(): number {
    return this.firebase.timestamp;
  }
}
