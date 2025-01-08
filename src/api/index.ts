import { Observable, ReplaySubject, EMPTY } from "rxjs";
import { fromEventPattern, firstValueFrom } from "rxjs";
import { filter, shareReplay, share, switchMap, map } from "rxjs/operators";
import { User } from "@firebase/auth-types";

import { FirebaseApp, FirebaseUser, FirebaseDevice } from "./firebase";
import { UserWithMetadata } from "./firebase";
import { Timesync } from "../timesync";
import { SubscriptionManager } from "../subscriptions/SubscriptionManager";
import { heartbeatAwareStatus } from "../utils/heartbeat";
import { filterInternalKeys } from "../utils/filterInternalKeys";
import { Client } from "../types/client";
import { Action, Actions } from "../types/actions";
import { Metrics, MetricValue } from "../types/metrics";
import { SDKOptions } from "../types/options";
import { SkillsClient, DeviceSkill } from "../types/skill";
import { Credentials, CustomToken } from "../types/credentials";
import { EmailAndPassword } from "../types/credentials";
import { ChangeSettings } from "../types/settings";
import { Subscription, PendingSubscription } from "../types/subscriptions";
import { DeviceStatus } from "../types/status";
import { DeviceInfo, DeviceSelector, OSVersion } from "../types/deviceInfo";
import { UserClaims } from "../types/user";
import { OAuthRemoveResponse } from "../types/oauth";
import { Experiment } from "../types/experiment";
import { TransferDeviceOptions } from "../utils/transferDevice";

export {
  credentialWithLink,
  createUser,
  SERVER_TIMESTAMP,
  __firebase
} from "./firebase";

/**
 * @hidden
 */
export class CloudClient implements Client {
  public user: UserWithMetadata | null = null;
  public userClaims: UserClaims | null = null;
  protected options: SDKOptions;
  protected firebaseApp: FirebaseApp;
  protected firebaseUser: FirebaseUser;
  protected firebaseDevice!: FirebaseDevice;
  protected timesync!: Timesync;
  protected subscriptionManager: SubscriptionManager;
  protected status$!: Observable<DeviceStatus>;
  protected osVersion$: Observable<OSVersion>;
  protected deviceId: string = "";

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

    this.setupStatus();

    this.osVersion$ = this.observeNamespace("info/osVersion").pipe(
      map((value) => value as unknown as OSVersion),
      shareReplay(1)
    );

    this.firebaseUser.onAuthStateChanged().subscribe((user) => {
      if (user) {
        this.user = { ...user, selectedDevice: null };
      } else {
        this.user = null;
      }
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
          getTimesync: this.firebaseDevice.getTimesync.bind(this.firebaseDevice)
        });
      }
    });
  }

  public onDeviceChange(): Observable<DeviceInfo> {
    return this._selectedDevice
      .asObservable()
      .pipe(
        filter(
          (value): value is DeviceInfo => value !== undefined && value !== null
        )
      );
  }

  public osVersion(): Observable<OSVersion> {
    return this.osVersion$;
  }

  // Automatically select device when user logs in
  private async setAutoSelectedDevice(): Promise<DeviceInfo | null> {
    // Select based on `deviceId` passed
    if (this.options.deviceId) {
      try {
        return await this.selectDevice((devices) => {
          const device = devices.find(
            (device) => device.deviceId === this.options.deviceId
          );
          if (!device) {
            throw new Error("Device not found");
          }
          return device;
        });
      } catch {
        return null;
      }
    }

    // Auto select first-claimed device
    if (!this.options.deviceId && this.options.autoSelectDevice) {
      try {
        return await this.selectDevice((devices) => {
          const device = devices[0];
          if (!device) {
            throw new Error("No devices available");
          }
          return device;
        });
      } catch {
        return null;
      }
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

  public async dispatchAction(action: Action): Promise<unknown> {
    return await this.firebaseDevice.dispatchAction(action);
  }

  public async disconnect(): Promise<void> {
    return this.firebaseApp.disconnect();
  }

  public async getInfo(): Promise<Record<string, unknown>> {
    return await this.firebaseDevice.getInfo();
  }

  public async login(credentials: Credentials): Promise<UserWithMetadata> {
    if (this.user) {
      return Promise.reject(`Already logged in.`);
    }

    const auth = await this.firebaseUser.login(credentials);
    const selectedDevice = await this.setAutoSelectedDevice();

    if (!auth.user) {
      throw new Error("Login failed: No user returned");
    }

    return {
      ...auth.user,
      selectedDevice
    } as UserWithMetadata;
  }

  public async logout(): Promise<void> {
    if (this.firebaseDevice) {
      this.firebaseDevice.disconnect();
    }

    return await this.firebaseUser.logout();
  }

  public onAuthStateChanged() {
    return this.firebaseUser.onAuthStateChanged().pipe(
      switchMap(async (user): Promise<UserWithMetadata | null> => {
        if (!user) {
          return null;
        }

        const hasSelectedDevice = await this.didSelectDevice();
        const selectedDevice = await (hasSelectedDevice
          ? this.getSelectedDevice()
          : this.setAutoSelectedDevice());

        const userWithMetadata: UserWithMetadata = {
          ...user,
          selectedDevice
        };

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
    try {
      const selectedDevice = await this.getSelectedDevice();
      return selectedDevice !== null;
    } catch {
      return false;
    }
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
        const deviceKeyValue = device[deviceKey as keyof DeviceInfo];
        return JSON.stringify(deviceKeyValue) === JSON.stringify(deviceValue);
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
    const device = await firstValueFrom(this._selectedDevice);
    return device === undefined ? null : device;
  }

  public status(): Observable<DeviceStatus> {
    return this.status$;
  }

  public observeNamespace(
    namespace: string
  ): Observable<Record<string, unknown>> {
    const getNamespaceValues = () =>
      fromEventPattern<Record<string, unknown>>(
        (handler: (value: Record<string, unknown>) => void) =>
          this.firebaseDevice.onNamespace(
            namespace,
            handler as (value: unknown) => void
          ),
        (handler: (value: Record<string, unknown>) => void) =>
          this.firebaseDevice.offNamespace(
            namespace,
            handler as (value: unknown) => void
          )
      );

    return this.firebaseDevice ? getNamespaceValues() : EMPTY;
  }

  public async onceNamespace(
    namespace: string
  ): Promise<Record<string, unknown>> {
    const result = await this.firebaseDevice.onceNamespace(namespace);
    return result as Record<string, unknown>;
  }

  public get metrics(): Metrics {
    return {
      next: (metricName: string, metricValue: MetricValue): void => {
        this.firebaseDevice.nextMetric(metricName, metricValue);
      },
      on: (
        subscription: PendingSubscription,
        callback: (metricValue: MetricValue) => void
      ): ((metricValue: MetricValue) => void) => {
        return this.firebaseDevice.onMetric(
          {
            ...subscription,
            id: "",
            clientId: "",
            serverType: "firebase",
            [Symbol.iterator]: undefined as any
          },
          (data: unknown) => callback(data as MetricValue)
        );
      },
      subscribe: (subscription: PendingSubscription): Subscription => {
        const subscriptionId = this.firebaseDevice.subscribeToMetric({
          ...subscription,
          id: "",
          clientId: "",
          serverType: "firebase",
          [Symbol.iterator]: undefined as any
        });
        const fullSubscription: Subscription = {
          ...subscription,
          id: subscriptionId,
          clientId: "",
          serverType: "firebase"
        };
        this.subscriptionManager.add(fullSubscription);
        return fullSubscription;
      },
      unsubscribe: (
        subscription: Subscription,
        listener: (metricValue: MetricValue) => void
      ): void => {
        this.subscriptionManager.remove(subscription);
        this.firebaseDevice.unsubscribeFromMetric({
          ...subscription,
          [Symbol.iterator]: undefined as any
        });
        this.firebaseDevice.removeMetricListener(
          {
            ...subscription,
            [Symbol.iterator]: undefined as any
          },
          (data: unknown) => listener(data as MetricValue)
        );
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
        const skill = await this.firebaseDevice.getSkill(bundleId);
        if (!skill) {
          throw new Error(`Skill ${bundleId} not found`);
        }
        return skill as DeviceSkill;
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
    return this.firebaseDevice.changeSettings(
      settings as Record<string, unknown>
    );
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

  protected setupStatus(): void {
    this.status$ = heartbeatAwareStatus(
      this.observeNamespace("status").pipe(
        map((value) => value as unknown as DeviceStatus),
        share()
      )
    ).pipe(filterInternalKeys(), shareReplay(1));
  }
}
