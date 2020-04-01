import { metrics } from "@neurosity/ipk";
import { FirebaseClient } from "./firebase/index";
import { WebsocketClient } from "./websocket";
import { Timesync } from "../timesync";
import { SubscriptionManager } from "../subscriptions/SubscriptionManager";
import { Client } from "../types/client";
import { Actions } from "../types/actions";
import { Metrics } from "../types/metrics";
import { NotionOptions } from "../types/options";
import { SkillsClient, DeviceSkill } from "../types/skill";
import { Credentials } from "../types/credentials";
import { ChangeSettings } from "../types/settings";

const isNotionMetric = (metric: string): boolean =>
  Object.keys(metrics).includes(metric);

export { credentialWithLink, createUser } from "./firebase";

/**
 * @hidden
 */
export class ApiClient implements Client {
  public user;
  protected options: NotionOptions;
  protected firebase: FirebaseClient;
  protected onDeviceSocket: WebsocketClient;
  protected timesync: Timesync;
  protected subscriptionManager: SubscriptionManager;

  constructor(options: NotionOptions) {
    this.options = options;
    this.subscriptionManager = new SubscriptionManager();
    this.firebase = new FirebaseClient(options, {
      subscriptionManager: this.subscriptionManager
    });

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

  public get actions(): Actions {
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

  public async logout(): Promise<any> {
    return await this.firebase.logout();
  }

  public auth() {
    return this.firebase.auth();
  }

  public onAuthStateChanged() {
    return this.firebase.onAuthStateChanged();
  }

  public onNamespace(namespace: string, callback: Function): Function {
    return this.firebase.onNamespace(namespace, callback);
  }

  public offNamespace(namespace: string, listener: Function): void {
    this.firebase.offNamespace(namespace, listener);
  }

  public get metrics(): Metrics {
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

        this.subscriptionManager.add(subscriptionCreated);
        return subscriptionCreated;
      },
      unsubscribe: (subscription, listener): void => {
        this.subscriptionManager.remove(subscription);
        this.firebase.unsubscribeFromMetric(subscription, listener);
      }
    };
  }

  public get skills(): SkillsClient {
    return {
      get: async (bundleId: string): Promise<DeviceSkill> => {
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

  public goOffline() {
    this.firebase.goOffline();
  }

  public goOnline() {
    this.firebase.goOnline();
  }
}
