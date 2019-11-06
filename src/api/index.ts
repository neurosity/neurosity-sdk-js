import { metrics } from "@neurosity/ipk";
import FirebaseClient from "./firebase/index";
import WebsocketClient from "./websocket";
import { Timesync } from "../timesync";
import IClient from "../types/client";
import IActions from "../types/actions";
import IMetrics from "../types/metrics";
import IOptions from "../types/options";
import { ISkillsClient, IDeviceSkill } from "../types/skill";
import { Credentials } from "../types/credentials";
import { ChangeSettings } from "../types/settings";

const isNotionMetric = (metric: string): boolean =>
  Object.keys(metrics).includes(metric);

/**
 * @hidden
 */
export default class ApiClient implements IClient {
  public user;
  protected options: IOptions;
  protected firebase: FirebaseClient;
  protected onDeviceSocket: WebsocketClient;
  protected timesync: Timesync;

  constructor(options: IOptions) {
    this.options = options;
    this.firebase = new FirebaseClient(options);

    this.firebase.onAuthStateChanged().subscribe(user => {
      this.user = user;
    });

    if (this.options.timesync) {
      this.firebase.onLogin().subscribe(() => {
        this.timesync = new Timesync({
          getTimesync: this.firebase.getTimesync.bind(this.firebase)
        });
      });
    }

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

  public async login(credentials: Credentials): Promise<any> {
    const user = await this.firebase.login(credentials);
    return user;
  }

  public onNamespace(namespace: string, callback: Function): Function {
    return this.firebase.onNamespace(namespace, callback);
  }

  public offNamespace(namespace: string, listener: Function): void {
    this.firebase.offNamespace(namespace, listener);
  }

  public get metrics(): IMetrics {
    const shouldRerouteToDevice = (metric: string): boolean =>
      this.onDeviceSocket && isNotionMetric(metric);
    return {
      next: (metricName, metricValue): void => {
        this.firebase.nextMetric(metricName, metricValue);
      },
      on: (subscription, callback) => {
        if (shouldRerouteToDevice(subscription.metric)) {
          return this.onDeviceSocket.onMetric(subscription, callback);
        } else {
          return this.firebase.onMetric(subscription, callback);
        }
      },
      subscribe: subscription => {
        const serverType = shouldRerouteToDevice(subscription.metric)
          ? this.onDeviceSocket.serverType
          : this.firebase.serverType;

        const subscriptionCreated = this.firebase.subscribeToMetric({
          ...subscription,
          serverType
        });
        return subscriptionCreated;
      },
      unsubscribe: (subscription, listener): void => {
        this.firebase.unsubscribFromMetric(subscription, listener);
      }
    };
  }

  public get skills(): ISkillsClient {
    return {
      get: async (bundleId: string): Promise<IDeviceSkill> => {
        return this.firebase.getSkill(bundleId);
      }
    };
  }

  public get timestamp(): number {
    return this.options.timesync ? this.timesync.timestamp : Date.now();
  }

  public changeSettings(settings: ChangeSettings): Promise<void> {
    return this.firebase.changeSettings(settings);
  }
}
