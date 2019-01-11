import { metrics } from "@neurosity/ipk";
import FirebaseClient from "./firebase/index";
import WebsocketClient from "./websocket";
import IClient from "./client.d";
import IActions from "./actions.d";
import IMetrics from "./metrics.d";
import IOptions from "../options.d";
import { ISkillsClient, IDeviceSkill } from "../skills/skill.d";

const isNotionMetric = (metric: string): boolean =>
  Object.keys(metrics).includes(metric);

/**
 * @hidden
 */
export default class ApiClient implements IClient {
  protected firebase: FirebaseClient;
  protected onDeviceSocket: WebsocketClient;

  constructor(options: IOptions) {
    this.firebase = new FirebaseClient(options);

    if (options.onDeviceSocketUrl) {
      this.onDeviceSocket = new WebsocketClient({
        deviceId: options.deviceId,
        socketUrl: options.onDeviceSocketUrl
      });
    }
  }

  public get actions(): IActions {
    return {
      dispatch: action => {
        return this.firebase.dispatchAction(action);
      }
    };
  }

  public async disconnect(): Promise<any> {
    if (this.onDeviceSocket) {
      this.onDeviceSocket.disconnect();
    }
    return this.firebase.disconnect();
  }

  public async getInfo(): Promise<any> {
    return await this.firebase.getInfo();
  }

  public onStatus(callback): void {
    this.firebase.onStatus(callback);
  }

  public get metrics(): IMetrics {
    const shouldRerouteToDevice = (metric: string): boolean =>
      this.onDeviceSocket && !isNotionMetric(metric);
    return {
      next: (metricName, metricValue): void => {
        this.firebase.nextMetric(metricName, metricValue);
      },
      on: (metricName, subscriptionId, callback): void => {
        if (shouldRerouteToDevice(metricName)) {
          this.onDeviceSocket.onMetric(subscriptionId, callback);
        } else {
          this.firebase.onMetric(subscriptionId, callback);
        }
      },
      subscribe: (subscription): string => {
        const serverType = shouldRerouteToDevice(subscription.metric)
          ? this.onDeviceSocket.serverType
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

  public get skills(): ISkillsClient {
    return {
      get: async (id: string): Promise<IDeviceSkill> => {
        return this.firebase.getSkill(id);
      }
    };
  }

  public get timestamp(): number {
    return this.firebase.timestamp;
  }
}
