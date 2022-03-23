import {
  Observable,
  BehaviorSubject,
  fromEventPattern,
  empty
} from "rxjs";
import { switchMap, filter, shareReplay } from "rxjs/operators";
import { FirebaseApp, FirebaseUser, FirebaseDevice } from "./firebase";
import { WebsocketClient } from "./websocket";
import { Timesync } from "../timesync";
import { SubscriptionManager } from "../subscriptions/SubscriptionManager";
import { offlineIfLostHeartbeat } from "../utils/heartbeat";
import { filterInternalKeys } from "../utils/filterInternalKeys";
import { Client } from "../types/client";
import { Actions } from "../types/actions";
import { Metrics } from "../types/metrics";
import { NotionOptions } from "../types/options";
import { SkillsClient, DeviceSkill } from "../types/skill";
import {
  Credentials,
  CustomToken,
  EmailAndPassword
} from "../types/credentials";
import { ChangeSettings } from "../types/settings";
import { Subscription } from "../types/subscriptions";
import { DeviceStatus } from "../types/status";
import { DeviceInfo, DeviceSelector } from "../types/deviceInfo";
import { UserClaims } from "../types/user";
import { OAuthRemoveResponse } from "../types/oauth";

export {
  credentialWithLink,
  createUser,
  SERVER_TIMESTAMP
} from "./firebase";

/**
 * @hidden
 */
export class ApiClient implements Client {
  public user;
  public userClaims;
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
  private _selectedDevice: BehaviorSubject<DeviceInfo | null> =
    new BehaviorSubject(undefined);

  constructor(options: NotionOptions) {
    this.options = options;
    this.subscriptionManager = new SubscriptionManager();
    this.firebaseApp = new FirebaseApp(options);
    this.firebaseUser = new FirebaseUser(this.firebaseApp);

    this.firebaseUser.onAuthStateChanged().subscribe((user) => {
      this.user = user;
    });

    this.firebaseUser.onUserClaimsChange().subscribe((userClaims) => {
      this.userClaims = userClaims;
    });

    this.onDeviceChange().subscribe((device) => {
      if (this.firebaseDevice) {
        this.firebaseDevice.disconnect();
      }

      if (!device) {
        return;
      }

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
    });
  }

  public onDeviceChange(): Observable<DeviceInfo> {
    return this._selectedDevice.asObservable().pipe(
      shareReplay(1),
      filter((value) => value !== undefined)
    );
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

    // Auto select first-claimed device
    if (!this.options.deviceId && this.options.autoSelectDevice) {
      return await this.selectDevice((devices) => {
        // Auto select first device
        return devices[0];
      });
    }

    return null;
  }

  public async setWebsocket(
    socketUrl: string,
    deviceId: string
  ): Promise<void> {
    this.websocket = new WebsocketClient({ socketUrl, deviceId });
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
    if (this.firebaseDevice) {
      this.firebaseDevice.disconnect();
    }

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

  public addDevice(deviceId: string): Promise<void> {
    return this.firebaseUser.addDevice(deviceId);
  }

  public async removeDevice(deviceId: string): Promise<void> {
    const [hasError, errorMessage] = await this.firebaseUser
      .removeDevice(deviceId)
      .then(() => [false])
      .catch((error) => [true, error]);

    if (hasError) {
      return Promise.reject(errorMessage);
    }

    const selectedDevice = this._selectedDevice.getValue();

    if (selectedDevice?.deviceId === deviceId) {
      this._selectedDevice.next(null);
    }
  }

  public onUserDevicesChange(): Observable<DeviceInfo[]> {
    return this.firebaseUser.onUserDevicesChange();
  }

  public onUserClaimsChange(): Observable<UserClaims> {
    return this.firebaseUser.onUserClaimsChange();
  }

  public didSelectDevice(): boolean {
    return !!this._selectedDevice.getValue();
  }

  public async selectDevice(
    deviceSelector: DeviceSelector
  ): Promise<DeviceInfo> {
    const devices = await this.getDevices();

    if (!devices) {
      return Promise.reject(
        `Did not find any devices for this user. Make sure your device is claimed by your Neurosity account.`
      );
    }

    const deviceTupleSelector = (devices: DeviceInfo[]) =>
      devices.find((device) => {
        if (!Array.isArray(deviceSelector)) {
          return false;
        }

        const [deviceKey, deviceValue] = deviceSelector;
        return (
          JSON.stringify(device?.[deviceKey]) ===
          JSON.stringify(deviceValue)
        );
      });

    const device =
      typeof deviceSelector === "function"
        ? deviceSelector(devices)
        : deviceTupleSelector(devices);

    if (!device) {
      return Promise.reject(
        `A device was not provided. Try returning a device from the devicesList provided in the callback.`
      );
    }

    const hasPermission = await this.firebaseUser.hasDevicePermission(
      device.deviceId
    );

    if (!hasPermission) {
      return Promise.reject(
        `Rejected device access due to permissions.`
      );
    }

    this._selectedDevice.next(device);

    return device;
  }

  public async getSelectedDevice(): Promise<DeviceInfo> {
    const selectedDevice = this._selectedDevice.getValue();

    if (!selectedDevice) {
      return Promise.reject(`There is no device currently selected.`);
    }

    const devices = await this.getDevices();

    if (!devices) {
      return Promise.reject(
        `Did not find any devices for this user. Make sure your device is claimed by your Neurosity account.`
      );
    }

    return devices.find(
      (device) => device.deviceId === selectedDevice.deviceId
    );
  }

  public status(): Observable<DeviceStatus> {
    return this.observeNamespace("status").pipe(
      offlineIfLostHeartbeat(),
      filterInternalKeys()
    );
  }

  public observeNamespace(namespace: string): Observable<any> {
    const namespaceValues$ = fromEventPattern(
      (handler) => this.firebaseDevice.onNamespace(namespace, handler),
      (handler) => this.firebaseDevice.offNamespace(namespace, handler)
    );

    return this.onDeviceChange().pipe(
      switchMap((selectedDevice) => {
        return selectedDevice ? namespaceValues$ : empty();
      })
    );
  }

  public async onceNamespace(namespace: string): Promise<any> {
    return await this.firebaseDevice.onceNamespace(namespace);
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
        const subscriptionCreated =
          this.firebaseDevice.subscribeToMetric(subscription);
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

  public createAccount(credentials: EmailAndPassword) {
    return this.firebaseUser.createAccount(credentials);
  }

  public deleteAccount() {
    return this.firebaseUser.deleteAccount();
  }

  public createCustomToken(): Promise<CustomToken> {
    return this.firebaseUser.createCustomToken();
  }

  public removeOAuthAccess(): Promise<OAuthRemoveResponse> {
    return this.firebaseUser.removeOAuthAccess();
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

  public getTimesyncOffset(): number {
    return this.timesync.offset;
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
