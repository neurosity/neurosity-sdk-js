import { Observable, ReplaySubject, EMPTY, timer } from "rxjs";
import { fromEventPattern, firstValueFrom } from "rxjs";
import { filter, shareReplay, switchMap, map, takeUntil } from "rxjs/operators";

import { FirebaseApp, FirebaseUser, FirebaseDevice } from "./firebase";
import { UserWithMetadata } from "./firebase";
import { Timesync } from "../timesync";
import { SubscriptionManager } from "../subscriptions/SubscriptionManager";
import { heartbeatAwareStatus } from "../utils/heartbeat";
import { filterInternalKeys } from "../utils/filterInternalKeys";
import { Client } from "../types/client";
import { Action, Actions } from "../types/actions";
import { Metrics } from "../types/metrics";
import { SDKOptions } from "../types/options";
import { SkillsClient, DeviceSkill } from "../types/skill";
import { Credentials, CustomToken } from "../types/credentials";
import { EmailAndPassword } from "../types/credentials";
import { Settings } from "../types/settings";
import { Subscription } from "../types/subscriptions";
import { DeviceStatus } from "../types/status";
import { DeviceInfo, DeviceSelector, DeviceSelectorFunction, OSVersion } from "../types/deviceInfo";
import { UserClaims } from "../types/user";
import { OAuthRemoveResponse } from "../types/oauth";
import { Experiment } from "../types/experiment";
import { TransferDeviceOptions } from "../utils/transferDevice";
import {
  ApiKeyRecord,
  CreateApiKeyRequest,
  RemoveApiKeyResponse
} from "../types/apiKey";

/**
 * @hidden
 */
export class CloudClient implements Client {
  public user;
  public userClaims;
  protected options: SDKOptions;
  protected firebaseApp: FirebaseApp;
  protected firebaseUser: FirebaseUser;
  protected firebaseDevice: FirebaseDevice;
  protected timesync: Timesync;
  protected subscriptionManager: SubscriptionManager;
  protected status$: Observable<DeviceStatus>;
  protected osVersion$: Observable<OSVersion>;

  /**
   * @internal
   */
  private _selectedDevice = new ReplaySubject<DeviceInfo | null | undefined>(1);

  constructor(options: SDKOptions) {
    this.options = options;
    this.subscriptionManager = new SubscriptionManager();
    this.firebaseApp = new FirebaseApp(options);
    this.firebaseUser = new FirebaseUser(this.firebaseApp);

    this._selectedDevice.next(undefined);

    this.status$ = heartbeatAwareStatus(
      this.observeNamespace("status").pipe(shareReplay(1))
    ).pipe(filterInternalKeys(), shareReplay(1));

    this.osVersion$ = this.observeNamespace("info/osVersion").pipe(
      shareReplay(1)
    );

    this.firebaseUser.onAuthStateChanged().subscribe((user) => {
      this.user = user;
    });

    this.firebaseUser.onUserClaimsChange().subscribe((userClaims) => {
      this.userClaims = userClaims;
    });

    this.onDeviceChange().subscribe(async (device) => {
      if (this.firebaseDevice) {
        try {
          await this.firebaseDevice.disconnect();
        } catch (error) {
          console.error("Error disconnecting from device", error);
        }
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
          getTimesync: this.firebaseDevice.getTimesync.bind(this.firebaseDevice)
        });
      }
    });
  }

  public onDeviceChange(): Observable<DeviceInfo> {
    return this._selectedDevice
      .asObservable()
      .pipe(filter((value) => value !== undefined));
  }

  public osVersion(): Observable<OSVersion> {
    return this.osVersion$;
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

  public get actions(): Actions {
    return {
      dispatch: (action) => {
        return this.firebaseDevice.dispatchAction(action);
      }
    };
  }

  public async dispatchAction(action: Action): Promise<any> {
    return await this.firebaseDevice.dispatchAction(action);
  }

  public async disconnect(): Promise<any> {
    if (this.firebaseDevice) {
      try {
        await this.firebaseDevice.disconnect();
      } catch (error) {
        console.error("Error disconnecting from device", error);
      }
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

    // We need guarantee that user claims are ready before finishing the
    // login process as permission-based validation is dependent on the user claims
    const userClaimsReady = await firstValueFrom(
      this.firebaseUser.onUserClaimsChange().pipe(
        filter((userClaims) => !!userClaims),
        map((userClaims) => !!userClaims),
        takeUntil(timer(1000))
      )
    );

    if (!userClaimsReady) {
      return Promise.reject(`Failed to get user claims.`);
    }

    return {
      ...auth,
      selectedDevice
    };
  }

  public async logout(): Promise<any> {
    if (this.firebaseDevice) {
      try {
        await this.firebaseDevice.disconnect();
      } catch (error) {
        console.error("Error disconnecting from device", error);
      }
    }

    return await this.firebaseUser.logout();
  }

  public onAuthStateChanged() {
    return this.firebaseUser.onAuthStateChanged().pipe(
      switchMap(async (user): Promise<UserWithMetadata> => {
        if (!user) {
          return null;
        }

        const didSelectDevice = await this.didSelectDevice();

        const selectedDevice = didSelectDevice
          ? await this.getSelectedDevice()
          : await this.setAutoSelectedDevice();

        const userWithMetadata: UserWithMetadata = Object.assign(user, {
          selectedDevice
        });

        return userWithMetadata;
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

    const selectedDevice = await this.getSelectedDevice();

    if (selectedDevice?.deviceId === deviceId) {
      this._selectedDevice.next(null);
    }
  }

  public async transferDevice(options: TransferDeviceOptions): Promise<void> {
    const [hasError, error] = await this.firebaseUser
      .transferDevice(options)
      .then(() => [false])
      .catch((error) => [true, error]);

    if (hasError) {
      return Promise.reject(error);
    }

    const selectedDevice = await this.getSelectedDevice();

    if (selectedDevice?.deviceId === options.deviceId) {
      this._selectedDevice.next(null);
    }
  }

  public onUserDevicesChange(): Observable<DeviceInfo[]> {
    return this.firebaseUser.onUserDevicesChange();
  }

  public onUserClaimsChange(): Observable<UserClaims> {
    return this.firebaseUser.onUserClaimsChange();
  }

  public async didSelectDevice(): Promise<boolean> {
    const selectedDevice = await this.getSelectedDevice();
    return !!selectedDevice;
  }

  private async finalizeDeviceSelection(device: DeviceInfo): Promise<DeviceInfo> {
    const hasPermission = await this.firebaseUser.hasDevicePermission(
      device.deviceId
    );

    if (!hasPermission) {
      return Promise.reject(`Rejected device access due to permissions.`);
    }

    this._selectedDevice.next(device);

    return device;
  }

  /**
   * Selects a device from the list of available devices based on a key-value pair of the device information.
   * 
   * @template K The type of the key.
   * @param {K} key The key to search for in the device information.
   * @param {DeviceInfo[K]} value The value to match with the specified key.
   * @returns {Promise<DeviceInfo>} A promise that resolves to the selected device information.
   * @throws {Error} If no devices are found for the user or if no device is found with the specified key-value pair.
   */
  public async selectDeviceByKeyValue<K extends keyof DeviceInfo>(
    key: K,
    value: DeviceInfo[K]
  ): Promise<DeviceInfo> {
    const devices = await this.getDevices();
    if (!devices.length) {
      throw new Error("No devices found for this user.");
    }

    const selectedDevice = devices.find(device => JSON.stringify(device[key]) === JSON.stringify(value));
    if (!selectedDevice) {
      throw new Error("Device not found with specified key-value pair.");
    }

    return this.finalizeDeviceSelection(selectedDevice);
  }

  /**
   * Selects a device based on the provided device selector function.
   * 
   * @param deviceSelector The device selector function used to select a device from the available devices.
   * @returns A promise that resolves to the selected device information.
   * @throws {Error} An error if no devices are found for the user or if the specified device is not found.
   */
  public async selectDeviceBySelector(
    deviceSelector: DeviceSelectorFunction
  ): Promise<DeviceInfo> {
    const devices = await this.getDevices();
    if (!devices.length) {
      throw new Error("No devices found for this user.");
    }

    const selectedDevice = deviceSelector(devices);
    if (!selectedDevice) {
      throw new Error("Device not found with specified selector.");
    }

    return this.finalizeDeviceSelection(selectedDevice);
  }

  /**
   * @deprecated Use `selectDeviceByKeyValue` or `selectDeviceBySelector` instead.
   */
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
          JSON.stringify(device?.[deviceKey]) === JSON.stringify(deviceValue)
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
      return Promise.reject(`Rejected device access due to permissions.`);
    }

    this._selectedDevice.next(device);

    return device;
  }

  public async getSelectedDevice(): Promise<DeviceInfo | null> {
    return await firstValueFrom(this._selectedDevice);
  }

  public status(): Observable<DeviceStatus> {
    return this.status$;
  }

  public observeNamespace(namespace: string): Observable<any> {
    const getNamespaceValues = () =>
      fromEventPattern(
        (handler) => this.firebaseDevice.onNamespace(namespace, handler),
        (handler) => this.firebaseDevice.offNamespace(namespace, handler)
      );

    return this.onDeviceChange().pipe(
      switchMap((selectedDevice) => {
        return selectedDevice ? getNamespaceValues() : EMPTY;
      })
    );
  }

  public async onceNamespace(namespace: string): Promise<any> {
    return await this.firebaseDevice.onceNamespace(namespace);
  }

  public get metrics(): Metrics {
    return {
      next: (metricName: string, metricValue: any): void => {
        this.firebaseDevice.nextMetric(metricName, metricValue);
      },
      on: (subscription: Subscription, callback: Function): Function => {
        return this.firebaseDevice.onMetric(subscription, callback);
      },
      subscribe: (subscription: Subscription): Subscription => {
        const subscriptionCreated =
          this.firebaseDevice.subscribeToMetric(subscription);
        this.subscriptionManager.add(subscriptionCreated);
        return subscriptionCreated;
      },
      unsubscribe: (subscription: Subscription, listener: Function): void => {
        this.subscriptionManager.remove(subscription);
        this.firebaseDevice.unsubscribeFromMetric(subscription);
        this.firebaseDevice.removeMetricListener(subscription, listener);
      }
    };
  }

  public createAccount(credentials: EmailAndPassword) {
    return this.firebaseUser.createAccount(credentials);
  }

  public deleteAccount() {
    return this.firebaseUser.deleteAccount();
  }

  public createBluetoothToken(): Promise<string> {
    return this.firebaseDevice.createBluetoothToken();
  }

  public createCustomToken(): Promise<CustomToken> {
    return this.firebaseUser.createCustomToken();
  }

  public createApiKey(data: CreateApiKeyRequest): Promise<ApiKeyRecord> {
    return this.firebaseUser.createApiKey(data);
  }

  public removeApiKey(apiKeyId: string): Promise<RemoveApiKeyResponse> {
    return this.firebaseUser.removeApiKey(apiKeyId);
  }

  public removeOAuthAccess(): Promise<OAuthRemoveResponse> {
    return this.firebaseUser.removeOAuthAccess();
  }

  public onUserExperiments(): Observable<Experiment[]> {
    return this.firebaseUser.onUserExperiments();
  }

  public deleteUserExperiment(experimentId: string): Promise<void> {
    return this.firebaseUser.deleteUserExperiment(experimentId);
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

  public changeSettings(settings: Settings): Promise<void> {
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
