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
import { Subscription } from "../types/subscriptions";

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
  protected websocket: WebsocketClient;
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

    if (this.options.transport === "offline") {
      this.initWebsocket();
    }
  }

  private initWebsocket() {
    if (this.options.onDeviceSocketUrl) {
      this.websocket = new WebsocketClient({
        deviceId: this.options.deviceId,
        socketUrl: this.options.onDeviceSocketUrl
      });
      return;
    }

    // this.websocket = new WebsocketClient({
    //   deviceId: this.options.deviceId
    // });

    this.onNamespace("status/socketUrl", (socketUrl: string | null) => {
      console.log("set socket is now", socketUrl);

      if (!socketUrl) {
        throw new Error(
          "Your device's OS does not support `offline` transport. Please update your OS to the latest version."
        );
      }

      this.websocket = new WebsocketClient({
        deviceId: this.options.deviceId,
        socketUrl: socketUrl
      });
    });
  }

  public get actions(): Actions {
    return {
      dispatch: action => {
        return this.firebase.dispatchAction(action);
      }
    };
  }

  public async disconnect(): Promise<any> {
    if (this.websocket) {
      this.websocket.disconnect();
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
    const isOfflineMetric = (metric: string): boolean =>
      this.options.transport === "offline" && isNotionMetric(metric);

    return {
      next: (metricName: string, metricValue: any): void => {
        this.firebase.nextMetric(metricName, metricValue);
      },
      on: (
        subscription: Subscription,
        callback: Function
      ): Function => {
        if (isOfflineMetric(subscription.metric)) {
          return this.websocket.onMetric(subscription, callback);
        } else {
          return this.firebase.onMetric(subscription, callback);
        }
      },
      subscribe: (subscription: Subscription): Subscription => {
        const serverType = isOfflineMetric(subscription.metric)
          ? WebsocketClient.serverType
          : FirebaseClient.serverType;

        const subscriptionCreated = this.firebase.subscribeToMetric({
          ...subscription,
          serverType
        });

        this.subscriptionManager.add(subscriptionCreated);
        return subscriptionCreated;
      },
      unsubscribe: (
        subscription: Subscription,
        listener: Function
      ): void => {
        this.subscriptionManager.remove(subscription);

        if (isOfflineMetric(subscription.metric)) {
          this.websocket.removeMetricListener(subscription, listener);
        } else {
          this.firebase.removeMetricListener(subscription, listener);
        }
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
