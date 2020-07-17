import { Observable, BehaviorSubject, throwError } from "rxjs";
import { FirebaseApp, FirebaseUser, FirebaseDevice } from "./firebase";
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
import { DeviceStatus } from "../types/status";
import { DeviceInfo } from "../types/deviceInfo";
import * as errors from "../utils/errors";
import { switchMap } from "rxjs/operators";

export { credentialWithLink, createUser } from "./firebase";

/**
 * @hidden
 */
export class ApiClient implements Client {
  public user;
  protected options: NotionOptions;
  protected firebaseApp: FirebaseApp;
  protected firebaseUser: FirebaseUser;
  protected firebaseDevice: FirebaseDevice;
  protected websocket: WebsocketClient;
  protected timesync: Timesync;
  protected subscriptionManager: SubscriptionManager;
  public defaultServerType: string = FirebaseDevice.serverType;
  public localServerType: string = WebsocketClient.serverType;

  /**
   * @internal
   */
  private _selectedDeviceId: BehaviorSubject<
    string | null
  > = new BehaviorSubject(null);

  constructor(options: NotionOptions) {
    this.options = options;
    this.subscriptionManager = new SubscriptionManager();
    this.firebaseApp = new FirebaseApp(options);
    this.firebaseUser = new FirebaseUser(this.firebaseApp);
    this.firebaseUser.onAuthStateChanged().subscribe((user) => {
      this.user = user;
    });
  }

  // Automatically select device when user logs in
  private async setAutoSelectedDevice(): Promise<DeviceInfo | null> {
    // Select based on `deviceId` passed
    if (this.options.deviceId) {
      return await this.selectDevice((devices) => {
        return devices.find(
          (device) => device.deviceId === this.options.deviceId
        );
      });
    }

    // Auto select device
    if (!this.options.deviceId && this.options.autoSelectDevice) {
      return await this.selectDevice((devices) => {
        // Auto select first device
        return devices[0];
      });
    }

    return null;
  }

  public setWebsocket(socketUrl: string): void {
    this.websocket = new WebsocketClient({ socketUrl });
  }

  public unsetWebsocket(): void {
    if (this.websocket) {
      this.websocket.disconnect();
      this.websocket = null;
    }
  }

  public get actions(): Actions {
    return {
      dispatch: (action) => {
        return this.firebaseDevice.dispatchAction(action);
      }
    };
  }

  public async disconnect(): Promise<any> {
    if (this.websocket) {
      this.websocket.disconnect();
    }

    return this.firebaseApp.disconnect();
  }

  public async getInfo(): Promise<any> {
    return await this.firebaseDevice.getInfo();
  }

  public async login(credentials: Credentials): Promise<any> {
    if (this.user) {
      return Promise.reject(`Already logged in.`);
    }

    const auth = await this.firebaseUser.login(credentials);
    const selectedDevice = await this.setAutoSelectedDevice();

    return {
      ...auth,
      selectedDevice
    };
  }

  public async logout(): Promise<any> {
    return await this.firebaseUser.logout();
  }

  public onAuthStateChanged() {
    return this.firebaseUser.onAuthStateChanged().pipe(
      switchMap(async (user) => {
        if (!user) {
          return null;
        }

        const selectedDevice = this.didSelectDevice()
          ? await this.getSelectedDevice()
          : await this.setAutoSelectedDevice();

        return {
          ...user,
          selectedDevice
        };
      })
    );
  }

  public getDevices() {
    return this.firebaseUser.getDevices();
  }

  public didSelectDevice(): boolean {
    return !!this._selectedDeviceId.getValue();
  }

  public async selectDevice(
    deviceSelector: (devices: DeviceInfo[]) => DeviceInfo
  ): Promise<DeviceInfo> {
    if (this.didSelectDevice()) {
      return Promise.reject(`There is a device already selected.`);
    }

    const devices = await this.getDevices();

    if (!devices) {
      return Promise.reject(
        `Did not find any devices for this user. Make sure your device is claimed by your Neurosity account.`
      );
    }

    const device = deviceSelector(devices);

    if (!device) {
      return Promise.reject(
        `A device was not provided. Try returning a device from the devicesList provided in the callback.`
      );
    }

    if (!devices.includes(device)) {
      return Promise.reject(`Invalid device provided.`);
    }

    this._selectedDeviceId.next(device.deviceId);

    this.firebaseDevice = new FirebaseDevice({
      deviceId: device.deviceId,
      firebaseApp: this.firebaseApp,
      dependencies: {
        subscriptionManager: this.subscriptionManager
      }
    });

    if (this.options.timesync) {
      this.timesync = new Timesync({
        status$: this.status(),
        getTimesync: this.firebaseDevice.getTimesync.bind(
          this.firebaseDevice
        )
      });
    }

    return device;
  }

  public async getSelectedDevice(): Promise<DeviceInfo> {
    const selectedDeviceId = this._selectedDeviceId.getValue();

    if (!selectedDeviceId) {
      return Promise.reject(`There is no device currently selected.`);
    }

    const devices = await this.getDevices();

    if (!devices) {
      return Promise.reject(
        `Did not find any devices for this user. Make sure your device is claimed by your Neurosity account.`
      );
    }

    return devices.find(
      (device) => device.deviceId === selectedDeviceId
    );
  }

  public status(): Observable<DeviceStatus> {
    if (!this.didSelectDevice()) {
      return throwError(errors.mustSelectDevice);
    }

    const namespace = "status";
    return new Observable((observer) => {
      const listener = this.onNamespace(
        namespace,
        (status: DeviceStatus) => {
          observer.next(status);
        }
      );

      return () => this.offNamespace(namespace, listener);
    });
  }

  public onNamespace(namespace: string, callback: Function): Function {
    return this.firebaseDevice.onNamespace(namespace, callback);
  }

  public async onceNamespace(namespace: string): Promise<any> {
    return await this.firebaseDevice.onceNamespace(namespace);
  }

  public offNamespace(namespace: string, listener: Function): void {
    this.firebaseDevice.offNamespace(namespace, listener);
  }

  public get metrics(): Metrics {
    const isWebsocketMetric = (subscription: Subscription): boolean =>
      subscription.serverType === WebsocketClient.serverType;

    return {
      next: (metricName: string, metricValue: any): void => {
        this.firebaseDevice.nextMetric(metricName, metricValue);
      },
      on: (
        subscription: Subscription,
        callback: Function
      ): Function => {
        if (isWebsocketMetric(subscription)) {
          return this.websocket.onMetric(subscription, callback);
        } else {
          return this.firebaseDevice.onMetric(subscription, callback);
        }
      },
      subscribe: (subscription: Subscription): Subscription => {
        const subscriptionCreated = this.firebaseDevice.subscribeToMetric(
          subscription
        );
        this.subscriptionManager.add(subscriptionCreated);
        return subscriptionCreated;
      },
      unsubscribe: (
        subscription: Subscription,
        listener: Function
      ): void => {
        this.subscriptionManager.remove(subscription);
        this.firebaseDevice.unsubscribeFromMetric(subscription);

        if (isWebsocketMetric(subscription)) {
          if (this.websocket) {
            this.websocket.removeMetricListener(subscription, listener);
          }
        } else {
          this.firebaseDevice.removeMetricListener(
            subscription,
            listener
          );
        }
      }
    };
  }

  public get skills(): SkillsClient {
    return {
      get: async (bundleId: string): Promise<DeviceSkill> => {
        return this.firebaseDevice.getSkill(bundleId);
      }
    };
  }

  public get timestamp(): number {
    return this.options.timesync ? this.timesync.timestamp : Date.now();
  }

  public changeSettings(settings: ChangeSettings): Promise<void> {
    return this.firebaseDevice.changeSettings(settings);
  }

  public goOffline() {
    this.firebaseApp.goOffline();
  }

  public goOnline() {
    this.firebaseApp.goOnline();
  }

  /**
   * @internal
   */
  public __getApp() {
    return this.firebaseApp.app;
  }
}
