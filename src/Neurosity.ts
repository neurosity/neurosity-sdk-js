import { combineLatest, EMPTY, Observable, of, throwError } from "rxjs";
import { ReplaySubject, firstValueFrom } from "rxjs";
import { map, startWith, switchMap } from "rxjs/operators";
import { distinctUntilChanged } from "rxjs/operators";
import { serverTimestamp } from "firebase/database";
import isEqual from "fast-deep-equal";
import { CloudClient } from "./api/index";
import { SDKOptions } from "./types/options";
import { STREAMING_MODE, STREAMING_TYPE } from "./types/streaming";
import { Training } from "./types/training";
import { Credentials, EmailAndPassword } from "./types/credentials";
import { CustomToken } from "./types/credentials";
import { Settings } from "./types/settings";
import { SignalQuality } from "./types/signalQuality";
import { SignalQualityV2 } from "./types/signalQualityV2";
import { Kinesis } from "./types/kinesis";
import { DeviceHealth } from "./types/deviceHealth";
import {
  KinesisEnsembleOptions,
  EnsembleStatus,
  MyClassifier,
  EnsembleSummary
} from "./types/ensemble";
import {
  getFirestore,
  collection,
  doc,
  query,
  where,
  setDoc,
  updateDoc,
  onSnapshot,
  getDocs,
  serverTimestamp as firestoreServerTimestamp
} from "firebase/firestore";
import { Calm } from "./types/calm";
import { Focus } from "./types/focus";
import { getLabels } from "./utils/subscription";
import { BrainwavesLabel, Epoch, PowerByBand, PSD } from "./types/brainwaves";
import { Accelerometer } from "./types/accelerometer";
import { DeviceInfo, OSVersion } from "./types/deviceInfo";
import { DeviceStatus, STATUS } from "./types/status";
import { Action } from "./types/actions";
import { HapticEffects } from "./types/hapticEffects";
import {
  RecordingOptions,
  RecordingResult,
  StartRecordingOptions,
  RecordingHandle
} from "./types/recording";
import * as errors from "./utils/errors";
import * as platform from "./utils/platform";
import * as hapticEffects from "./utils/hapticEffects";
import { validateScopeBasedPermissionForFunctionName } from "./utils/permissions";
import { validateScopeBasedPermissionForAction } from "./utils/permissions";
import { createOAuthURL } from "./api/https/createOAuthURL";
import { getOAuthToken } from "./api/https/getOAuthToken";
import { OAuthConfig, OAuthQuery } from "./types/oauth";
import { OAuthQueryResult, OAuthRemoveResponse } from "./types/oauth";
import { UserClaims } from "./types/user";
import { isNode } from "./utils/is-node";
import { getCloudMetric } from "./utils/metrics";
import { whileOnline } from "./utils/whileOnline";
import {
  Experiment,
  CreateExperimentOptions,
  ExperimentMarker,
  ExperimentTrial,
  ExperimentPrediction,
  EmulatorStatusPatch
} from "./types/experiment";
import { TransferDeviceOptions } from "./utils/transferDevice";
import { BluetoothClient, osHasBluetoothSupport } from "./api/bluetooth";
import { BLUETOOTH_CONNECTION } from "./api/bluetooth/types";
import {
  ApiKeyRecord,
  CreateApiKeyRequest,
  RemoveApiKeyResponse
} from "./types/apiKey";

const defaultOptions = {
  timesync: false,
  autoSelectDevice: true,
  streamingMode: STREAMING_MODE.WIFI_ONLY,
  emulator: false,
  emulatorHost: "localhost",
  emulatorAuthPort: 9099,
  emulatorDatabasePort: 9000,
  emulatorFunctionsPort: 5001,
  emulatorFirestorePort: 8080,
  emulatorOptions: {}
};

/**
 * import StreamingModes from "@site/src/components/StreamingModes";
 *
 * Example
 * ```typescript
 * import { Neurosity } from "@neurosity/sdk";
 *
 * const neurosity = new Neurosity();
 * ```
 */
export class Neurosity {
  /**
   * @hidden
   */
  protected options: SDKOptions;

  /**
   * @hidden
   */
  protected cloudClient: CloudClient;

  /**
   * @hidden
   */
  protected bluetoothClient: BluetoothClient;

  /**
   * @hidden
   */
  protected isMissingBluetoothTransport: boolean;

  /**
   * @hidden
   */
  private streamingMode$ = new ReplaySubject<STREAMING_MODE>(1);

  /**
   *
   * @hidden
   */
  static get SERVER_TIMESTAMP() {
    return serverTimestamp();
  }

  /**
   * Creates new instance of the Neurosity SDK
   * 
   * ```typescript
   * const neurosity = new Neurosity();
   * ```

   * @param options
   */
  constructor(options: SDKOptions = {}) {
    const { streamingMode, bluetoothTransport } = options;

    this.options = Object.freeze({
      ...defaultOptions,
      ...options
    });

    this.cloudClient = new CloudClient(this.options);

    if (!!bluetoothTransport) {
      this.bluetoothClient = new BluetoothClient({
        selectedDevice$: this.onDeviceChange(),
        osHasBluetoothSupport$: this._osHasBluetoothSupport(),
        createBluetoothToken: this.createBluetoothToken.bind(this),
        transport: bluetoothTransport
      });
    }

    this._initStreamingMode(streamingMode, !!bluetoothTransport);
  }

  /**
   *
   * @hidden
   */
  _initStreamingMode(
    streamingMode: STREAMING_MODE,
    hasBluetoothTransport: boolean
  ): void {
    const streamingModeFeaturesBluetooth = [
      STREAMING_MODE.BLUETOOTH_WITH_WIFI_FALLBACK,
      STREAMING_MODE.WIFI_WITH_BLUETOOTH_FALLBACK
    ].includes(streamingMode);

    const isInvalidStreamingMode =
      !Object.values(STREAMING_MODE).includes(streamingMode);

    const isMissingBluetoothTransport =
      streamingModeFeaturesBluetooth && !hasBluetoothTransport;

    this.isMissingBluetoothTransport = isMissingBluetoothTransport;

    const shouldDefaultToCloud =
      !streamingMode || isInvalidStreamingMode || isMissingBluetoothTransport;

    // Default to backwards compatible cloud streaming mode if:
    // 1. No streaming mode is provided
    // 2. An invalid streaming mode is provided
    // 3. A streaming mode containing bluetooth is provided, but without a bluetooth transport
    if (shouldDefaultToCloud) {
      this.streamingMode$.next(STREAMING_MODE.WIFI_ONLY);
    } else {
      this.streamingMode$.next(streamingMode);
    }
  }

  /**
   *
   * @hidden
   */
  _osHasBluetoothSupport() {
    return combineLatest({
      selectedDevice: this.onDeviceChange(),
      osVersion: this.osVersion().pipe(startWith(null))
    }).pipe(
      map(({ selectedDevice, osVersion }) =>
        osHasBluetoothSupport(selectedDevice, osVersion)
      )
    );
  }

  /**
   * Subscribe to the device's streaming state changes and the current strategy
   *
   * Streams the current mode of streaming (wifi or bluetooth).
   *
   * ```typescript
   * neurosity.streamingState().subscribe((streamingState) => {
   *   console.log(streamingState);
   *   // { streamingMode: "wifi-only", activeMode: "wifi", connected: true }
   * });
   * ```
   */
  public streamingState(): Observable<{
    connected: boolean;
    activeMode: STREAMING_TYPE;
    streamingMode: STREAMING_MODE;
  }> {
    const isWifiOnline = (state: STATUS) =>
      [STATUS.ONLINE, STATUS.UPDATING].includes(state);

    return this.streamingMode$.pipe(
      switchMap((streamingMode: STREAMING_MODE) => {
        return combineLatest({
          selectedDevice: this.onDeviceChange(),
          osHasBluetoothSupport: this._osHasBluetoothSupport()
        }).pipe(
          switchMap(({ selectedDevice, osHasBluetoothSupport }) => {
            if (!selectedDevice) {
              return of({
                connected: false,
                streamingMode,
                activeMode: STREAMING_TYPE.WIFI
              });
            }

            const isUnableToUseBluetooth =
              this.isMissingBluetoothTransport || !osHasBluetoothSupport;

            if (isUnableToUseBluetooth) {
              return this.cloudClient.status().pipe(
                map(({ state }) => ({
                  connected: isWifiOnline(state),
                  streamingMode,
                  activeMode: STREAMING_TYPE.WIFI
                }))
              );
            }

            return combineLatest({
              wifiStatus: this.cloudClient.status(),
              bluetoothConnection: !!this?.bluetoothClient
                ? this.bluetoothClient.connection()
                : of(BLUETOOTH_CONNECTION.DISCONNECTED)
            }).pipe(
              map(({ wifiStatus, bluetoothConnection }) => {
                const isBluetoothConnected =
                  bluetoothConnection === BLUETOOTH_CONNECTION.CONNECTED;

                switch (streamingMode) {
                  default:
                  case STREAMING_MODE.WIFI_ONLY:
                    return {
                      connected: isWifiOnline(wifiStatus.state),
                      streamingMode,
                      activeMode: STREAMING_TYPE.WIFI
                    };

                  case STREAMING_MODE.WIFI_WITH_BLUETOOTH_FALLBACK:
                    return {
                      connected:
                        isWifiOnline(wifiStatus.state) || !isBluetoothConnected
                          ? isWifiOnline(wifiStatus.state)
                          : isBluetoothConnected,
                      streamingMode,
                      activeMode:
                        isWifiOnline(wifiStatus.state) || !isBluetoothConnected
                          ? STREAMING_TYPE.WIFI
                          : STREAMING_TYPE.BLUETOOTH
                    };

                  case STREAMING_MODE.BLUETOOTH_WITH_WIFI_FALLBACK:
                    return {
                      connected: isBluetoothConnected
                        ? true
                        : isWifiOnline(wifiStatus.state),
                      streamingMode,
                      activeMode: isBluetoothConnected
                        ? STREAMING_TYPE.BLUETOOTH
                        : STREAMING_TYPE.WIFI
                    };
                }
              }),
              distinctUntilChanged((a, b) => isEqual(a, b))
            );
          })
        );
      })
    );
  }

  /**
   *
   * @hidden
   */
  _withStreamingModeObservable<T>(streams: {
    wifi: () => Observable<T>;
    bluetooth: () => Observable<T>;
  }): Observable<any> {
    const { wifi, bluetooth } = streams;

    return this.streamingState().pipe(
      switchMap(({ activeMode }) => {
        switch (activeMode) {
          case STREAMING_TYPE.WIFI:
            return wifi();

          case STREAMING_TYPE.BLUETOOTH:
            return bluetooth();

          default:
            return wifi();
        }
      })
    );
  }

  /**
   *
   * @hidden
   */
  async _withStreamingModePromise<T>(promises: {
    wifi: () => Promise<T>;
    bluetooth: () => Promise<T>;
  }): Promise<T> {
    const { wifi, bluetooth } = promises;

    const { activeMode } = await firstValueFrom(this.streamingState());

    switch (activeMode) {
      case STREAMING_TYPE.WIFI:
        return await wifi();

      case STREAMING_TYPE.BLUETOOTH:
        return await bluetooth();

      default:
        return await wifi();
    }
  }

  /**
   *
   * @hidden
   */
  get bluetooth() {
    return this?.bluetoothClient;
  }

  /**
   *
   * @hidden
   */
  private _getCloudMetricDependencies() {
    return {
      options: this.options,
      cloudClient: this.cloudClient,
      onDeviceChange: this.onDeviceChange.bind(this),
      status: this.status.bind(this)
    };
  }

  /**
   * @hidden
   *
   * Subscribes to a firmware-emitted metric without running the
   * `@neurosity/ipk` label/metric validation that `getCloudMetric`
   * applies. Used for telemetry streams that don't have a fixed label
   * vocabulary (e.g. `deviceHealth`, `ensembleStatus`) and would
   * otherwise be rejected by `validate` for missing labels.
   *
   * Mirrors the inner Observable that `getCloudMetric` builds — same
   * subscribe/on/unsubscribe lifecycle, same online/sleep gating.
   */
  private _observeRawMetric<T>(metric: string): Observable<T> {
    const cloudClient = this.cloudClient;

    const metric$ = new Observable<T>((observer) => {
      const subscription = cloudClient.metrics.subscribe({
        metric,
        labels: [],
        atomic: false
      });

      const listener = cloudClient.metrics.on(
        subscription,
        (...data: any[]) => {
          // @ts-expect-error - data is not typed
          observer.next(...data);
        }
      );

      return () => {
        cloudClient.metrics.unsubscribe(subscription, listener);
      };
    });

    return this.onDeviceChange().pipe(
      switchMap((device: DeviceInfo) => {
        if (!device) {
          return EMPTY;
        }
        return metric$.pipe(
          whileOnline({
            status$: this.status(),
            allowWhileOnSleepMode: false
          })
        );
      })
    );
  }

  /**
   * Starts user session
   *
   * ```typescript
   * await neurosity.login({
   *   email: "...",
   *   password: "..."
   * });
   * ```
   *
   * @param credentials
   */
  public async login(credentials: Credentials): Promise<void> {
    return await this.cloudClient.login(credentials);
  }

  /**
   * Ends user session
   *
   * ```typescript
   * await neurosity.logout();
   * // session has ended
   * ```
   *
   */
  public async logout(): Promise<void> {
    return await this.cloudClient.logout();
  }

  /**
   * @internal
   * Not user facing.
   */
  public __getApp() {
    return this.cloudClient.__getApp();
  }

  /**
   * Subscribe to auth state changes
   *
   * Streams the state of the auth session. If user has logged in, the user object will be set. When logged out, the user object will be null.
   *
   * ```typescript
   * neurosity.onAuthStateChanged().subscribe((user) => {
   *   console.log(user);
   * });
   * ```
   */
  public onAuthStateChanged(): Observable<any> {
    return this.cloudClient.onAuthStateChanged();
  }

  /**
   * Add a device to the user's account
   *
   * ```typescript
   * await neurosity.addDevice("[deviceId]");
   * ```
   */
  public addDevice(deviceId: string): Promise<void> {
    const [hasOAuthError, OAuthError] =
      validateScopeBasedPermissionForFunctionName(
        this.cloudClient.userClaims,
        "addDevice"
      );

    if (hasOAuthError) {
      return Promise.reject(OAuthError);
    }

    return this.cloudClient.addDevice(deviceId);
  }

  /**
   * Remove a device from the user's account
   *
   * ```typescript
   * await neurosity.removeDevice("[deviceId]");
   * ```
   */
  public removeDevice(deviceId: string): Promise<void> {
    const [hasOAuthError, OAuthError] =
      validateScopeBasedPermissionForFunctionName(
        this.cloudClient.userClaims,
        "removeDevice"
      );

    if (hasOAuthError) {
      return Promise.reject(OAuthError);
    }

    return this.cloudClient.removeDevice(deviceId);
  }

  /**
   * Transfer a device to the user's account
   *
   * ```typescript
   * await neurosity.transferDevice({
   *   deviceId: "[deviceId]",
   *   newOwnerEmail: "[newOwnerEmail]"
   * });
   * ```
   */
  public transferDevice(options: TransferDeviceOptions): Promise<void> {
    const [hasOAuthError, OAuthError] =
      validateScopeBasedPermissionForFunctionName(
        this.cloudClient.userClaims,
        "transferDevice"
      );

    if (hasOAuthError) {
      return Promise.reject(OAuthError);
    }

    return this.cloudClient.transferDevice(options);
  }

  /**
   * Subscribe to user devices changes
   *
   * ```typescript
   * neurosity.onUserDevicesChange().subscribe((devices) => {
   *   console.log(devices);
   * });
   * ```
   */
  public onUserDevicesChange(): Observable<DeviceInfo[]> {
    const [hasOAuthError, OAuthError] =
      validateScopeBasedPermissionForFunctionName(
        this.cloudClient.userClaims,
        "onUserDevicesChange"
      );

    if (hasOAuthError) {
      return throwError(() => OAuthError);
    }

    return this.cloudClient.onUserDevicesChange();
  }

  /**
   * Subscribe to user claims changes
   *
   * ```typescript
   * neurosity.onUserClaimsChange().subscribe((userClaims) => {
   *   console.log(userClaims);
   * });
   * ```
   */
  public onUserClaimsChange(): Observable<UserClaims> {
    return this.cloudClient.onUserClaimsChange();
  }

  /**
   * Get user devices
   *
   * Returns a list of devices claimed by the user authenticated.
   *
   * ```typescript
   * const devices = await neurosity.getDevices();
   * console.log(devices);
   * ```
   */
  public async getDevices(): Promise<DeviceInfo[]> {
    return await this.cloudClient.getDevices();
  }

  /**
   * Select Device
   *
   * Rarely necessary, but useful when the user owns multiple devices.
   *
   * A common use case for manually selecting a device is when you wish to build a device dropdown a user can select from, instead of collecting the Device Id from the user ahead of time.
   *
   * The 3 steps to manually selecting a device are:
   *
   * - Set `autoSelectDevice` to false when instantiating the `Neurosity` class.
   * - Authenticate with your Neurosity account to access your devices by calling the `neurosity.login(...)` function.
   * - Call the `neurosity.selectDevice(...)` function with a device selector function.
   *
   * ```typescript
   * const devices = await neurosity.selectDevice((devices) =>
   *   devices.find((device) => device.deviceNickname === "Crown-A1B")
   * );
   *
   * console.log(devices);
   * ```
   *
   * > If you own multiple devices, and don't pass `autoSelectDevice`, then the first device on the list will be automatically selected.
   *
   * For more info, check out the "Device Selection" guide.
   */
  public async selectDevice(
    deviceSelector: (devices: DeviceInfo[]) => DeviceInfo
  ): Promise<DeviceInfo> {
    const [hasOAuthError, OAuthError] =
      validateScopeBasedPermissionForFunctionName(
        this.cloudClient.userClaims,
        "selectDevice"
      );

    if (hasOAuthError) {
      return Promise.reject(OAuthError);
    }

    return await this.cloudClient.selectDevice(deviceSelector);
  }

  /**
   * Get selected device
   *
   * ```typescript
   * const selectedDevice = await neurosity.getSelectedDevice();
   * console.log(selectedDevice);
   * ```
   */

  public async getSelectedDevice(): Promise<DeviceInfo> {
    const [hasOAuthError, OAuthError] =
      validateScopeBasedPermissionForFunctionName(
        this.cloudClient.userClaims,
        "getSelectedDevice"
      );

    if (hasOAuthError) {
      return Promise.reject(OAuthError);
    }

    return await this.cloudClient.getSelectedDevice();
  }

  /**
   * ```typescript
   * const info = await neurosity.getInfo();
   * ```
   */
  public async getInfo(): Promise<DeviceInfo> {
    if (!(await this.cloudClient.didSelectDevice())) {
      return Promise.reject(errors.mustSelectDevice);
    }

    const [hasOAuthError, OAuthError] =
      validateScopeBasedPermissionForFunctionName(
        this.cloudClient.userClaims,
        "getInfo"
      );

    if (hasOAuthError) {
      return Promise.reject(OAuthError);
    }

    return await this._withStreamingModePromise({
      wifi: () => this.cloudClient.getInfo(),
      bluetooth: () => this.bluetoothClient.getInfo()
    });
  }

  /**
   * Observes selected device
   *
   * ```typescript
   * neurosity.onDeviceChange().subscribe(device => {
   *  console.log(device);
   * });
   * ```
   */
  public onDeviceChange(): Observable<DeviceInfo> {
    const [hasOAuthError, OAuthError] =
      validateScopeBasedPermissionForFunctionName(
        this.cloudClient.userClaims,
        "onDeviceChange"
      );

    if (hasOAuthError) {
      return throwError(() => OAuthError);
    }

    return this.cloudClient.onDeviceChange();
  }

  /**
   * <StreamingModes wifi={true} bluetooth={true} />
   *
   * Ends database connection
   *
   * ```typescript
   * await neurosity.disconnect();
   * ```
   */
  public async disconnect(): Promise<void> {
    return await this._withStreamingModePromise({
      wifi: () => this.cloudClient.disconnect(),
      bluetooth: () => this.bluetoothClient.disconnect()
    });
  }

  /**
   * <StreamingModes wifi={true} bluetooth={true} />
   *
   * @internal
   * Not user facing
   */
  private async dispatchAction(action: Action): Promise<Action> {
    if (!(await this.cloudClient.didSelectDevice())) {
      return Promise.reject(errors.mustSelectDevice);
    }

    const [hasOAuthError, OAuthError] = validateScopeBasedPermissionForAction(
      this.cloudClient.userClaims,
      action
    );

    if (hasOAuthError) {
      return Promise.reject(OAuthError);
    }

    return await this._withStreamingModePromise({
      wifi: () => this.cloudClient.dispatchAction(action),
      bluetooth: () => this.bluetoothClient.dispatchAction(action)
    });
  }

  /**
   * <StreamingModes wifi={true} bluetooth={true} />
   *
   * Injects an EEG marker to data stream
   *
   * ```typescript
   * neurosity.addMarker("eyes-closed");
   *
   * // later...
   *
   * neurosity.addMarker("eyes-open");
   * ```
   *
   * @param label Name the label to inject
   */
  public async addMarker(label: string): Promise<Action> {
    if (!(await this.cloudClient.didSelectDevice())) {
      throw errors.mustSelectDevice;
    }

    if (!label) {
      throw new Error(`${errors.prefix}A label is required for addMarker`);
    }

    return await this._withStreamingModePromise({
      wifi: () =>
        this.cloudClient.dispatchAction({
          command: "marker",
          action: "add",
          message: {
            label,
            timestamp: this.cloudClient.timestamp
          }
        }),
      bluetooth: () => this.bluetoothClient.addMarker(label)
    });
  }

  /**
   * <StreamingModes wifi={true} bluetooth={true} />
   *
   * Queue haptic motor commands
   *
   * To queue haptic P7 only,
   * ```typescript
   * await neurosity.haptics({
   *   P7: ["tripleClick100"]
   * });
   * ```
   *
   * To queue both motors at the same time
   * ```typescript
   * await neurosity.haptics({
   *   P7: [neurosity.getHapticEffects().strongClick100],
   *   P8: [neurosity.getHapticEffects().strongClick100]
   * });
   * ```
   *
   * You can queue different commands to the motors too
   * ```typescript
   * const effects = neurosity.getHapticEffects();
   * await neurosity.haptics({
   *   P7: [effects.transitionRampUpLongSmooth1_0_to_100,
   *         effects.transitionRampDownLongSmooth1_100_to_0],
   *   P8: [effects.strongClick100]
   * });
   * ```
   *
   * @param effects Effects to queue. The key of the object passed should be the location of the motor
   *  to queue. Each key can be an array of up to 7 commands. There is no haptic support for model
   *  version 1, Notion DK1. The Haptic motor's location is positioned in reference to the 10-10 EEG
   *  system used to label the channels of the Crown's EEG sensors. Notion 2 and Crown have haptics
   *  at P7 and P8. A list of haptic commands can be found on ./utils/hapticCodes.ts - there
   *  are about 127 of them!
   */
  public async haptics(effects: any): Promise<any> {
    const metric = "haptics";
    if (!(await this.cloudClient.didSelectDevice())) {
      return Promise.reject(errors.mustSelectDevice);
    }

    const modelVersion = (await this.getSelectedDevice())?.modelVersion;
    const supportsHaptics = platform.supportsHaptics(modelVersion);

    if (!supportsHaptics) {
      return Promise.reject(
        errors.metricNotSupportedByModel(metric, modelVersion)
      );
    }

    const newPlatformHapticRequest =
      platform.getPlatformHapticMotors(modelVersion);

    for (const key in effects) {
      if (!Object.keys(newPlatformHapticRequest).includes(key)) {
        return Promise.reject(errors.locationNotFound(key, modelVersion));
      }
      const singleMotorEffects: string[] = effects[key];
      const maxItems = 7;
      if (singleMotorEffects.length > maxItems) {
        return Promise.reject(errors.exceededMaxItems(maxItems));
      }
      newPlatformHapticRequest[key] = singleMotorEffects;
    }

    const payload = {
      command: metric,
      action: "queue",
      responseRequired: true,
      responseTimeout: 1000,
      message: { effects: newPlatformHapticRequest }
    };

    return await this._withStreamingModePromise({
      wifi: () => this.cloudClient.dispatchAction(payload),
      bluetooth: () => this.bluetoothClient.dispatchAction(payload)
    });
  }

  /**
   * ```typescript
   * const effects = neurosity.getHapticEffects();
   * ```
   */
  public getHapticEffects(): HapticEffects {
    return hapticEffects;
  }

  /**
   * <StreamingModes wifi={true} bluetooth={true} />
   *
   * Observes accelerometer data
   * Supported by the Crown and Notion 2 devices.
   *
   * ```typescript
   * neurosity.accelerometer().subscribe(accelerometer => {
   *   console.log(accelerometer);
   * });
   *
   * // { acceleration: ..., inclination: ..., orientation: ..., pitch: ..., roll: ..., x: ..., y: ..., z: ... }
   * ```
   *
   * @returns Observable of accelerometer metric events
   */
  public accelerometer(): Observable<Accelerometer> {
    const metric = "accelerometer";

    const [hasOAuthError, OAuthError] =
      validateScopeBasedPermissionForFunctionName(
        this.cloudClient.userClaims,
        metric
      );

    if (hasOAuthError) {
      return throwError(() => OAuthError);
    }

    return this.onDeviceChange().pipe(
      switchMap((selectedDevice: DeviceInfo | null) => {
        const modelVersion =
          selectedDevice?.modelVersion || platform.MODEL_VERSION_1;
        const supportsAccel = platform.supportsAccel(modelVersion);

        if (!supportsAccel) {
          return throwError(() =>
            errors.metricNotSupportedByModel(metric, modelVersion)
          );
        }

        return this._withStreamingModeObservable({
          wifi: () =>
            getCloudMetric(this._getCloudMetricDependencies(), {
              metric,
              labels: getLabels(metric),
              atomic: true
            }),
          bluetooth: () => this.bluetoothClient.accelerometer()
        });
      })
    );
  }

  /**
   * <StreamingModes wifi={true} bluetooth={true} />
   * 
   * The `raw` brainwaves parameter emits epochs of 16 samples for Crown and 25 for Notion 1 and 2.
   *
   * Example
   * ```typescript
   * neurosity.brainwaves("raw").subscribe(brainwaves => {
   *   console.log(brainwaves);
   * });
   * ```
   *
   * Raw Unfiltered - The `rawUnfiltered` brainwaves parameter emits epochs of 16 samples for Crown and 25 for Notion 1 and 2. 

   * Example
   * ```typescript
   * neurosity.brainwaves("rawUnfiltered").subscribe(brainwaves => {
   *   console.log(brainwaves);
   * });
   * ```
   *
   * Power By Band - The `powerByBand` brainwaves parameter emits epochs 4 times a second. Every frequency label (e.g. beta) contains an average power value per channel.
   * 
   * Example
   * ```typescript
   * neurosity.brainwaves("powerByBand").subscribe(brainwaves => {
   *   console.log(brainwaves);
   * });
   * ```
   *
   * Power Spectral Density (PSD) - The `psd` brainwaves parameter emits epochs 4 times a second. Every frequency label (e.g. alpha) contains the computed FFT (Fast Fourier transform) value per channel (see the `psd` property), as well as the frequency ranges (see the `freqs` property).
   * 
   * Example
   * ```typescript
   * neurosity.brainwaves("psd").subscribe(brainwaves => {
   *   console.log(brainwaves);
   * });
   * ```
   *
   * @param label Name of metric properties to filter by
   * @returns Observable of brainwaves metric events
   */
  public brainwaves(
    label: BrainwavesLabel
  ): Observable<Epoch | PowerByBand | PSD> {
    const [hasOAuthError, OAuthError] =
      validateScopeBasedPermissionForFunctionName(
        this.cloudClient.userClaims,
        "brainwaves"
      );

    if (hasOAuthError) {
      return throwError(() => OAuthError);
    }

    return this._withStreamingModeObservable({
      wifi: () =>
        getCloudMetric(this._getCloudMetricDependencies(), {
          metric: "brainwaves",
          labels: label ? [label] : [],
          atomic: false
        }),
      // @TODO: doesn't support multiple labels, we should make the higher
      // order function only support one label
      bluetooth: () => this.bluetoothClient.brainwaves(label)
    });
  }

  /**
   * <StreamingModes wifi={true} />
   *
   * Records raw brainwave data for a specified duration and saves it
   * as a dataset. The recording is stored in cloud storage and a
   * metadata record is created in Firestore. If the network is
   * unavailable, the recording is saved locally on the device and
   * uploaded automatically when connectivity is restored.
   *
   * ```typescript
   * const result = await neurosity.record({
   *   label: "eyes-closed",
   *   duration: 60000
   * });
   *
   * console.log(result.id); // Firestore record ID
   * ```
   *
   * With all options:
   * ```typescript
   * const result = await neurosity.record({
   *   name: "Morning session",
   *   label: "focus-training",
   *   duration: 120000,
   *   experimentId: "exp-001"
   * });
   * ```
   *
   * @param options Recording options including label and duration
   * @returns Promise resolving to the recording result
   */
  public async record(options: RecordingOptions): Promise<RecordingResult> {
    if (!(await this.cloudClient.didSelectDevice())) {
      return Promise.reject(errors.mustSelectDevice);
    }

    const [hasOAuthError, OAuthError] =
      validateScopeBasedPermissionForAction(this.cloudClient.userClaims, {
        command: "brainwaves",
        action: "record",
        message: options
      });

    if (hasOAuthError) {
      return Promise.reject(OAuthError);
    }

    if (!options.label) {
      return Promise.reject(
        new Error(`${errors.prefix}A label is required for record.`)
      );
    }

    if (!options.duration || options.duration <= 0) {
      return Promise.reject(
        new Error(`${errors.prefix}A positive duration is required for record.`)
      );
    }

    const MAX_DURATION = 30 * 60 * 1000;
    if (options.duration > MAX_DURATION) {
      return Promise.reject(
        new Error(
          `${errors.prefix}Duration ${options.duration}ms exceeds maximum of ${MAX_DURATION}ms (30 minutes).`
        )
      );
    }

    const response = await this.dispatchAction({
      command: "brainwaves",
      action: "record",
      message: {
        name: options.name || options.label,
        label: options.label,
        duration: options.duration,
        experimentId: options.experimentId || "sdk-recording"
      },
      responseRequired: true,
      responseTimeout: options.duration + 90000
    });

    return response?.message ?? response;
  }

  /**
   * <StreamingModes wifi={true} />
   *
   * Starts a variable-length brainwave recording and returns a handle
   * for controlling it. Use this when you need UI control over the
   * recording lifecycle (progress, cancel, stop-and-save).
   *
   * ```typescript
   * const recording = await neurosity.startRecording({
   *   label: "eyes-closed",
   *   maxDuration: 120000 // 2 minute max
   * });
   *
   * // Track progress
   * recording.elapsed$.subscribe(ms => {
   *   console.log(`Recording: ${(ms / 1000).toFixed(0)}s`);
   * });
   *
   * // Stop and save after some time
   * const result = await recording.stop();
   * console.log(result.id);
   *
   * // Or cancel without saving
   * await recording.cancel();
   * ```
   *
   * @param options Recording options including label and maxDuration
   * @returns Promise resolving to a RecordingHandle
   */
  public async startRecording(
    options: StartRecordingOptions
  ): Promise<RecordingHandle> {
    if (!(await this.cloudClient.didSelectDevice())) {
      return Promise.reject(errors.mustSelectDevice);
    }

    const [hasOAuthError, OAuthError] =
      validateScopeBasedPermissionForAction(this.cloudClient.userClaims, {
        command: "brainwaves",
        action: "startRecording",
        message: options
      });

    if (hasOAuthError) {
      return Promise.reject(OAuthError);
    }

    if (!options.label) {
      return Promise.reject(
        new Error(`${errors.prefix}A label is required for startRecording.`)
      );
    }

    if (!options.maxDuration || options.maxDuration <= 0) {
      return Promise.reject(
        new Error(
          `${errors.prefix}A positive maxDuration is required for startRecording.`
        )
      );
    }

    const MAX_DURATION = 30 * 60 * 1000;
    if (options.maxDuration > MAX_DURATION) {
      return Promise.reject(
        new Error(
          `${errors.prefix}Duration ${options.maxDuration}ms exceeds maximum of ${MAX_DURATION}ms (30 minutes).`
        )
      );
    }

    // Start the recording on the device
    const response = await this.dispatchAction({
      command: "brainwaves",
      action: "startRecording",
      message: {
        name: options.name || options.label,
        label: options.label,
        maxDuration: options.maxDuration,
        experimentId: options.experimentId || "sdk-recording"
      },
      responseRequired: true,
      responseTimeout: options.maxDuration + 10000
    });

    const startResponse = response?.message ?? response;

    if (!startResponse?.ok) {
      return Promise.reject(
        new Error(
          `${errors.prefix}Failed to start recording: ${
            startResponse?.error || "unknown error"
          }`
        )
      );
    }

    const { cancel: cancelAction, complete: completeAction } = startResponse;
    const startTime = Date.now();
    let stopped = false;

    // Result promise that resolves when stop() or cancel() is called
    let resolveResult: (value: RecordingResult) => void;
    const resultPromise = new Promise<RecordingResult>((resolve) => {
      resolveResult = resolve;
    });

    // Elapsed timer observable (~1Hz), completes when recording stops
    const elapsedSubscribers = new Set<any>();
    const elapsed$ = new Observable<number>((subscriber) => {
      elapsedSubscribers.add(subscriber);
      const timer = setInterval(() => {
        subscriber.next(Date.now() - startTime);
      }, 1000);

      return () => {
        clearInterval(timer);
        elapsedSubscribers.delete(subscriber);
      };
    });

    const completeAllElapsed = () => {
      for (const sub of elapsedSubscribers) {
        sub.complete();
      }
    };

    const stop = async (): Promise<RecordingResult> => {
      if (stopped) return resultPromise;
      stopped = true;
      completeAllElapsed();

      const stopResponse = await this.dispatchAction(completeAction);
      const result: RecordingResult =
        stopResponse?.message ?? stopResponse ?? { ok: true };

      resolveResult(result);
      return result;
    };

    const cancel = async (): Promise<void> => {
      if (stopped) return;
      stopped = true;
      completeAllElapsed();

      await this.dispatchAction(cancelAction);
      resolveResult({ ok: false, error: "cancelled" });
    };

    return {
      elapsed$,
      stop,
      cancel,
      result: resultPromise
    };
  }

  /**
   * <StreamingModes wifi={true} bluetooth={true} />
   *
   * Example
   * ```typescript
   * neurosity.calm().subscribe(calm => {
   *   console.log(calm.probability);
   * });
   *
   * // 0.45
   * // 0.47
   * // 0.53
   * // 0.51
   * // ...
   * ```
   *
   * @returns Observable of calm events - awareness/calm alias
   */
  public calm(): Observable<Calm> {
    const [hasOAuthError, OAuthError] =
      validateScopeBasedPermissionForFunctionName(
        this.cloudClient.userClaims,
        "calm"
      );

    if (hasOAuthError) {
      return throwError(() => OAuthError);
    }

    return this._withStreamingModeObservable({
      wifi: () =>
        getCloudMetric(this._getCloudMetricDependencies(), {
          metric: "awareness",
          labels: ["calm"],
          atomic: false
        }),
      bluetooth: () => this.bluetoothClient.calm()
    });
  }

  /**
   * <StreamingModes wifi={true} bluetooth={true} />
   *
   * Observes signal quality data where each property is the name
   * of the channel and the value includes the standard deviation and
   * a status set by the device
   *
   * ```typescript
   * neurosity.signalQuality().subscribe(signalQuality => {
   *   console.log(signalQuality);
   * });
   *
   * // { FC6: { standardDeviation: 3.5, status: "good" }, C3: {...}, ... }
   * ```
   *
   * @returns Observable of signalQuality metric events
   */
  public signalQuality(): Observable<SignalQuality> {
    const metric = "signalQuality";

    const [hasOAuthError, OAuthError] =
      validateScopeBasedPermissionForFunctionName(
        this.cloudClient.userClaims,
        metric
      );

    if (hasOAuthError) {
      return throwError(() => OAuthError);
    }

    return this._withStreamingModeObservable({
      wifi: () =>
        getCloudMetric(this._getCloudMetricDependencies(), {
          metric,
          labels: getLabels(metric),
          atomic: true
        }),
      bluetooth: () => this.bluetoothClient.signalQuality()
    });
  }

  /**
   * <StreamingModes wifi={true} bluetooth={true} />
   *
   * Observes signal quality with normalized scores (0-1) per channel
   * and an overall score.
   *
   * ```typescript
   * neurosity.signalQualityV2().subscribe(quality => {
   *   console.log(quality.overall.score);  // 0-1
   *   console.log(quality.byChannel.CP3.score);  // 0-1
   * });
   *
   * // { timestamp: 1234567890, overall: { score: 0.85 }, byChannel: { CP3: { score: 0.9 }, ... } }
   * ```
   *
   * @returns Observable of signalQualityV2 metric events
   */
  public signalQualityV2(): Observable<SignalQualityV2> {
    const metric = "signalQualityV2";

    const [hasOAuthError, OAuthError] =
      validateScopeBasedPermissionForFunctionName(
        this.cloudClient.userClaims,
        "signalQuality" // Reuse same scope
      );

    if (hasOAuthError) {
      return throwError(() => OAuthError);
    }

    return this._withStreamingModeObservable({
      wifi: () =>
        getCloudMetric(this._getCloudMetricDependencies(), {
          metric,
          labels: getLabels(metric),
          atomic: true
        }),
      bluetooth: () => this.bluetoothClient.signalQualityV2()
    });
  }

  /**
   * <StreamingModes wifi={true} />
   *
   * Observes last state of `settings` and all subsequent `settings` changes
   *
   * ```typescript
   * neurosity.settings().subscribe(settings => {
   *   console.log(settings.lsl);
   * });
   *
   * // true
   * // ...
   * ```
   *
   * @returns Observable of `settings` metric events
   */
  public settings(): Observable<Settings> {
    const [hasOAuthError, OAuthError] =
      validateScopeBasedPermissionForFunctionName(
        this.cloudClient.userClaims,
        "settings"
      );

    if (hasOAuthError) {
      return throwError(() => OAuthError);
    }

    return this.cloudClient.observeNamespace("settings");
  }

  /**
   * <StreamingModes wifi={true} />
   *
   * Observes the current OS version and all subsequent version changes in real-time.
   *
   * ```typescript
   * neurosity.osVersion().subscribe((osVersion) => {
   *   console.log(osVersion);
   * });
   *
   * // "16.0.0"
   * ```
   *
   * @returns Observable of `osVersion` events. e.g 16.0.0
   */
  public osVersion(): Observable<OSVersion> {
    const [hasOAuthError, OAuthError] =
      validateScopeBasedPermissionForFunctionName(
        this.cloudClient.userClaims,
        "osVersion"
      );

    if (hasOAuthError) {
      return throwError(() => OAuthError);
    }

    return this.cloudClient.osVersion();
  }

  /**
   * <StreamingModes wifi={true} bluetooth={true} />
   *
   * Example
   * ```typescript
   * neurosity.focus().subscribe(focus => {
   *   console.log(focus.probability);
   * });
   *
   * // 0.56
   * // 0.46
   * // 0.31
   * // 0.39
   * // ...
   * ```
   *
   * @returns Observable of focus events - awareness/focus alias
   */
  public focus(): Observable<Focus> {
    const [hasOAuthError, OAuthError] =
      validateScopeBasedPermissionForFunctionName(
        this.cloudClient.userClaims,
        "focus"
      );

    if (hasOAuthError) {
      return throwError(() => OAuthError);
    }

    return this._withStreamingModeObservable({
      wifi: () =>
        getCloudMetric(this._getCloudMetricDependencies(), {
          metric: "awareness",
          labels: ["focus"],
          atomic: false
        }),
      bluetooth: () => this.bluetoothClient.focus()
    });
  }

  /**
   * <StreamingModes wifi={true} />
   *
   * @param label Name of metric properties to filter by
   * @returns Observable of kinesis metric events
   */
  public kinesis(label: string): Observable<Kinesis> {
    const metric = "kinesis";

    const [hasOAuthError, OAuthError] =
      validateScopeBasedPermissionForFunctionName(
        this.cloudClient.userClaims,
        metric
      );

    if (hasOAuthError) {
      return throwError(() => OAuthError);
    }

    return getCloudMetric(this._getCloudMetricDependencies(), {
      metric,
      labels: label ? [label] : [],
      atomic: false
    });
  }

  // ---------------------------------------------------------------------------
  // Crown Community Ensembles (R2) — additive surface over `kinesis(label)`.
  //
  // `kinesis(label)` semantics are unchanged for users without ensemble.
  // When the firmware resolver picks an ensemble for a label, the same
  // `kinesis(label)` stream is transparently STIG-backed — apps don't
  // need to migrate. The methods below let an app explicitly request
  // an ensemble config, observe the engine's health, contribute donor
  // classifiers, and browse hardware-matched bundles.
  // ---------------------------------------------------------------------------

  /**
   * <StreamingModes wifi={true} />
   *
   * Requests an ensemble-backed Kinesis stream for `label`. Writes the
   * resolver override to `users/{uid}/ensembleSessions/{sessionId}`
   * before subscribing so the firmware sees the override on the next
   * resolver tick; emits Kinesis events as the normal `kinesis(label)`
   * path does.
   */
  public kinesisEnsemble(opts: KinesisEnsembleOptions): Observable<Kinesis> {
    const metric = "kinesis";

    const [hasOAuthError, OAuthError] =
      validateScopeBasedPermissionForFunctionName(
        this.cloudClient.userClaims,
        metric
      );

    if (hasOAuthError) {
      return throwError(() => OAuthError);
    }

    // Fire-and-forget the session write; the firmware resolver picks it
    // up on its next tick. Errors are surfaced through the kinesis
    // stream's normal error channel (a missing session degrades to the
    // device's default classifier — no ensemble — which matches the
    // pre-ensemble behavior).
    this._writeEnsembleSession(opts).catch((error) => {
      console.error("kinesisEnsemble: failed to write session config", error);
    });

    return getCloudMetric(this._getCloudMetricDependencies(), {
      metric,
      labels: [opts.label],
      atomic: false
    });
  }

  /**
   * <StreamingModes wifi={true} />
   *
   * Observes the active ensemble engine's health — donor count, SML
   * personalization score, refit cadence — emitted by the firmware
   * analytics container.
   */
  public kinesisEnsembleStatus(): Observable<EnsembleStatus> {
    return this._observeRawMetric<EnsembleStatus>("ensembleStatus");
  }

  /**
   * Opt a classifier into (or out of) the community donor pool.
   *
   * - `share: true`  → flips `sharingEnabled`; the gate evaluation
   *   Cloud Function will populate `passedGate` / `gateScore`.
   * - `share: false` → revokes; the cloud writer stamps `retiredAt`
   *   so donor bundles drop it on next refresh.
   */
  public async contributeClassifier(input: {
    classifierId: string;
    share: boolean;
  }): Promise<void> {
    if (!input.classifierId) {
      return Promise.reject(
        new Error("contributeClassifier: classifierId is required")
      );
    }

    const app = this.cloudClient.__getApp();
    const db = getFirestore(app);
    const ref = doc(db, `memories/${input.classifierId}`);

    if (input.share) {
      await updateDoc(ref, {
        sharingEnabled: true,
        sharedAt: firestoreServerTimestamp(),
        retiredAt: null,
        retirementReason: null
      });
    } else {
      await updateDoc(ref, {
        sharingEnabled: false,
        retiredAt: firestoreServerTimestamp(),
        retirementReason: "user_revoked"
      });
    }
  }

  /**
   * Live read of the user's own classifier docs. Reflects gate state
   * and fleet stats as the cloud aggregator updates them.
   */
  public myClassifiers(): Observable<MyClassifier[]> {
    return new Observable<MyClassifier[]>((observer) => {
      const userId = this.cloudClient.user?.uid;
      if (!userId) {
        observer.error(new Error("myClassifiers: user is not authenticated"));
        return () => {};
      }

      const app = this.cloudClient.__getApp();
      const db = getFirestore(app);
      // Classifiers live in the `memories` collection (Crown firmware
      // writes them through @neurosity/api). Filter to the current
      // user's classifier docs only; rules predicate at memories/{id}
      // gates everything else.
      const coll = collection(db, "memories");
      const q = query(
        coll,
        where("userId", "==", userId),
        where("type", "==", "classifier")
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot: any) => {
          const docs: MyClassifier[] = snapshot.docs.map((d: any) => {
            const data = d.data();
            return {
              id: d.id,
              label: data.label,
              trainedAt: data.trainedAt,
              repCount: data.repCount,
              sharingEnabled: !!data.sharingEnabled,
              passedGate:
                typeof data.passedGate === "boolean" ? data.passedGate : null,
              gateScore:
                typeof data.gateScore === "number" ? data.gateScore : null,
              stats: data.stats
            };
          });
          observer.next(docs);
        },
        (err: any) => observer.error(err)
      );

      return () => unsubscribe();
    });
  }

  /**
   * Hardware-filtered listing of system-curated and user-curated
   * ensembles available for `label`. The cloud query already filters
   * by label and visibility; this method enforces the
   * `hardware.modelId` match locally so a device only ever sees
   * compatible bundles.
   */
  public async listEnsembles(input: {
    label: string;
  }): Promise<EnsembleSummary[]> {
    if (!input.label) {
      return Promise.reject(new Error("listEnsembles: label is required"));
    }

    const device = await firstValueFrom(this.onDeviceChange());
    if (!device) {
      return Promise.reject(
        new Error("listEnsembles: no device selected")
      );
    }

    const app = this.cloudClient.__getApp();
    const db = getFirestore(app);
    // The `ensembles` collection is world-readable by rule (see
    // firestore.rules `match /ensembles/{id}`), so we only filter by
    // label here and apply the device-hardware filter in-memory below.
    // Retired ensembles are excluded via the per-doc `retiredAt`
    // predicate after fetch.
    const coll = collection(db, "ensembles");
    const q = query(coll, where("label", "==", input.label));

    const snapshot: any = await getDocs(q);
    const all: EnsembleSummary[] = snapshot.docs.map((d: any) => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name,
        classifierCount: data.classifierCount,
        kind: data.kind,
        hardware: data.hardware,
        votes: data.votes,
        updatedAt: data.updatedAt
      };
    });

    const deviceModelId = (device as DeviceInfo).modelName;
    return all.filter((e) => e.hardware?.modelId === deviceModelId);
  }

  /**
   * @hidden
   *
   * Writes an ensemble resolver-override doc the firmware reads on
   * its next tick. Path: `users/{uid}/ensembleSessions/{label}`.
   */
  private async _writeEnsembleSession(
    opts: KinesisEnsembleOptions
  ): Promise<void> {
    const userId = this.cloudClient.user?.uid;
    if (!userId) {
      throw new Error("_writeEnsembleSession: user is not authenticated");
    }

    const deviceId = this.options.deviceId;
    const app = this.cloudClient.__getApp();
    const db = getFirestore(app);
    const ref = doc(
      db,
      `users/${userId}/ensembleSessions/${opts.label}`
    );

    await setDoc(ref, {
      label: opts.label,
      mode: opts.mode ?? "auto",
      ensembleId: opts.ensembleId ?? null,
      classifierIds: opts.classifierIds ?? null,
      refitIntervalSecs: opts.refitIntervalSecs ?? null,
      spectralLearning:
        typeof opts.spectralLearning === "boolean"
          ? opts.spectralLearning
          : null,
      deviceId,
      updatedAt: Date.now()
    });
  }

  /**
   * <StreamingModes wifi={true} />
   *
   * @param label Name of metric properties to filter by
   * @returns Observable of predictions metric events
   */
  public predictions(label: string): Observable<any> {
    const metric = "predictions";

    const [hasOAuthError, OAuthError] =
      validateScopeBasedPermissionForFunctionName(
        this.cloudClient.userClaims,
        metric
      );

    if (hasOAuthError) {
      return throwError(() => OAuthError);
    }

    return getCloudMetric(this._getCloudMetricDependencies(), {
      metric,
      labels: label ? [label] : [],
      atomic: false
    });
  }

  /**
   * <StreamingModes wifi={true} />
   *
   * Observes host-side device-health telemetry — per-core CPU load,
   * free memory, SoC temperature, and thermal-throttle state — emitted
   * by the firmware Node API at ~5s cadence.
   *
   * ```typescript
   * neurosity.deviceHealth().subscribe(health => {
   *   console.log(health.thermalC, health.thermalThrottled);
   * });
   * ```
   *
   * @returns Observable of `deviceHealth` metric events
   */
  public deviceHealth(): Observable<DeviceHealth> {
    return this._observeRawMetric<DeviceHealth>("deviceHealth");
  }

  /**
   * <StreamingModes wifi={true} bluetooth={true} />
   *
   * Observes last state of `status` and all subsequent `status` changes
   *
   * ```typescript
   * neurosity.status().subscribe(status => {
   *   console.log(status.state);
   * });
   *
   * // "online"
   * // ...
   * ```
   *
   * @returns Observable of `status` metric events
   */
  public status(): Observable<DeviceStatus> {
    const [hasOAuthError, OAuthError] =
      validateScopeBasedPermissionForFunctionName(
        this.cloudClient.userClaims,
        "status"
      );

    if (hasOAuthError) {
      return throwError(() => OAuthError);
    }

    return this._withStreamingModeObservable({
      wifi: () => this.cloudClient.status(),
      bluetooth: () => this.bluetoothClient.status()
    }).pipe(distinctUntilChanged((a, b) => isEqual(a, b)));
  }

  /**
   *
   * <StreamingModes wifi={true} />
   *
   * Changes device settings programmatically. These settings can be
   * also changed from the developer console under device settings.
   *
   * Available settings [[Settings]]
   *
   * Example
   * ```typescript
   * neurosity.changeSettings({
   *   lsl: true
   * });
   * ```
   */
  public async changeSettings(settings: Settings): Promise<void> {
    if (!(await this.cloudClient.didSelectDevice())) {
      return Promise.reject(errors.mustSelectDevice);
    }

    const [hasOAuthError, OAuthError] =
      validateScopeBasedPermissionForFunctionName(
        this.cloudClient.userClaims,
        "changeSettings"
      );

    if (hasOAuthError) {
      return Promise.reject(OAuthError);
    }

    return await this.cloudClient.changeSettings(settings);
  }

  /**
   * <StreamingModes wifi={true} />
   *
   * ```typescript
   * neurosity.training.record({
   *   metric: "kinesis",
   *   label: "push"
   * });
   *
   * neurosity.training.stop({
   *   metric: "kinesis",
   *   label: "push"
   * });
   * ```
   *
   * @returns Training methods
   */
  public get training(): Training {
    return {
      /**
       * <StreamingModes wifi={true} />
       *
       * Records a training for a metric/label pair
       * @category Training
       */
      record: async (training) => {
        if (!(await this.cloudClient.didSelectDevice())) {
          throw errors.mustSelectDevice;
        }

        const userId =
          this.cloudClient.user && "uid" in this.cloudClient.user
            ? this.cloudClient.user.uid
            : null;
        const message = {
          fit: false,
          baseline: false,
          timestamp: this.cloudClient.timestamp,
          ...training,
          userId
        };

        await this.cloudClient.actions.dispatch({
          command: "training",
          action: "record",
          message
        });
      },
      /**
       * <StreamingModes wifi={true} />
       *
       * Stops the training for a metric/label pair
       * @category Training
       */
      stop: async (training) => {
        if (!(await this.cloudClient.didSelectDevice())) {
          throw errors.mustSelectDevice;
        }

        await this.cloudClient.actions.dispatch({
          command: "training",
          action: "stop",
          message: {
            ...training
          }
        });
      },
      /**
       * <StreamingModes wifi={true} />
       *
       * Stops all trainings
       * @category Training
       */
      stopAll: async () => {
        if (!(await this.cloudClient.didSelectDevice())) {
          throw errors.mustSelectDevice;
        }

        await this.cloudClient.actions.dispatch({
          command: "training",
          action: "stopAll",
          message: {}
        });
      }
    };
  }

  /**
   * @internal
   * Proof of Concept for disconnecting db
   */
  public goOffline(): void {
    this.cloudClient.goOffline();
  }

  /**
   * @internal
   * Proof of Concept for resuming db connection
   */
  public goOnline(): void {
    this.cloudClient.goOnline();
  }

  /**
   *
   * Creates user account and automatically signs in with same credentials
   *
   * @param emailAndPasswordObject
   * @returns user credential
   */
  public createAccount(credentials: EmailAndPassword) {
    return this.cloudClient.createAccount(credentials);
  }

  /**
   *
   * Removes all devices from an account and then deletes the account
   */
  public deleteAccount() {
    return this.cloudClient.deleteAccount();
  }

  /**
   * @internal
   * Not user facing
   *
   * Creates token (JWT) designed to authenticate and authorize Bluetooth clients/centrals.
   *
   * @returns token
   */
  public createBluetoothToken(): Promise<string> {
    return this.cloudClient.createBluetoothToken();
  }

  /**
   * @internal
   * Not user facing yet
   *
   * Creates custom token (JWT) to use to login with `{ customToken }`.
   *
   * @returns custom token
   */
  public createCustomToken(): Promise<CustomToken> {
    const [hasOAuthError, OAuthError] =
      validateScopeBasedPermissionForFunctionName(
        this.cloudClient.userClaims,
        "createCustomToken"
      );

    if (hasOAuthError) {
      return Promise.reject(OAuthError);
    }

    return this.cloudClient.createCustomToken();
  }

  /**
   * Creates API key to use to login with `{ apiKey }`.
   *
   * @returns API key record
   */
  public createApiKey(data: CreateApiKeyRequest): Promise<ApiKeyRecord> {
    const [hasOAuthError, OAuthError] =
      validateScopeBasedPermissionForFunctionName(
        this.cloudClient.userClaims,
        "createApiKey"
      );

    if (hasOAuthError) {
      return Promise.reject(OAuthError);
    }

    return this.cloudClient.createApiKey(data);
  }

  /**
   * Removes API key
   *
   * @param data
   * @returns void
   */
  public removeApiKey(apiKeyId: string): Promise<RemoveApiKeyResponse> {
    const [hasOAuthError, OAuthError] =
      validateScopeBasedPermissionForFunctionName(
        this.cloudClient.userClaims,
        "removeApiKey"
      );

    if (hasOAuthError) {
      return Promise.reject(OAuthError);
    }

    return this.cloudClient.removeApiKey(apiKeyId);
  }

  /**
   * @internal
   * Not user facing yet
   *
   * Gets the offset between the device's clock and the client's clock
   * Requires option.timesync to be true
   *
   * @returns timesyncOffset
   */
  public getTimesyncOffset(): number {
    if (!this.options.timesync) {
      console.warn(`getTimesyncOffset() requires options.timesync to be true.`);
    }

    return this.options.timesync ? this.cloudClient.getTimesyncOffset() : 0;
  }

  /**
   * Create OAuth URL
   * 💡 OAuth requires developers to register their apps with Neurosity
   * [Read full OAuth guide](/docs/api/oauth)
   *
   * Creates client-specific OAuth URL. This is the first step of the OAuth workflow. Use this function to create a URL you can use to redirect users to the Neurosity sign-in page.
   * 💡 This function is designed to only run on the server side for security reasons, as it requires your client secret.
   *
   * ```typescript
   * const { Neurosity } = require("@neurosity/sdk");
   *
   * const neurosity = new Neurosity({
   *   autoSelectDevice: false
   * });
   *
   * exports.handler = async function (event) {
   *   return neurosity
   *     .createOAuthURL({
   *       clientId: process.env.NEUROSITY_OAUTH_CLIENT_ID,
   *       clientSecret: process.env.NEUROSITY_OAUTH_CLIENT_SECRET,
   *       redirectUri: process.env.NEUROSITY_OAUTH_CLIENT_REDIRECT_URI,
   *       responseType: "token",
   *       state: Math.random().toString().split(".")[1],
   *       scope: [
   *         "read:devices-info",
   *         "read:devices-status",
   *         "read:signal-quality",
   *         "read:brainwaves"
   *       ]
   *     })
   *     .then((url) => ({
   *       statusCode: 200,
   *       body: JSON.stringify({ url })
   *     }))
   *     .catch((error) => ({
   *       statusCode: 400,
   *       body: JSON.stringify(error.response.data)
   *     }));
   * };
   * ```
   * @returns custom token
   */
  public createOAuthURL(config: OAuthConfig): Promise<string> {
    if (!isNode()) {
      return Promise.reject(
        new Error(
          `${errors.prefix}the createOAuthURL method must be used on the server side (node.js) for security reasons.`
        )
      );
    }

    return createOAuthURL(config, this.options);
  }

  /**
   * Get OAuth Token
   * 💡 OAuth requires developers to register their apps with Neurosity
   * [Read full OAuth guide](/docs/api/oauth)
   *
   * Gets client-specific OAuth token for a given userId.
   *
   * 💡 This function is designed to only run on the server side for security reasons, as it requires your client secret.
   * Here's an example of a cloud function that receives a `userId` via query params and loads the client id and client secret securely via environment variables.
   *
   *
   * ```typescript
   * const { Neurosity } = require("@neurosity/sdk");
   *
   * const neurosity = new Neurosity({
   *   autoSelectDevice: false
   * });
   *
   * exports.handler = async function (event) {
   *   const userId = event.queryStringParameters?.userId;
   *
   *   return neurosity
   *     .getOAuthToken({
   *       clientId: process.env.NEUROSITY_OAUTH_CLIENT_ID,
   *       clientSecret: process.env.NEUROSITY_OAUTH_CLIENT_SECRET,
   *       userId
   *     })
   *     .then((token) => ({
   *       statusCode: 200,
   *       body: JSON.stringify(token)
   *     }))
   *     .catch((error) => ({
   *       statusCode: 200,
   *       body: JSON.stringify(error.response.data)
   *     }));
   * };
   * ```
   * @returns custom token
   */
  public getOAuthToken(query: OAuthQuery): Promise<OAuthQueryResult> {
    if (!isNode()) {
      return Promise.reject(
        new Error(
          `${errors.prefix}the getOAuthToken method must be used on the server side (node.js) for security reasons.`
        )
      );
    }

    return getOAuthToken(query, this.options);
  }

  /**
   * Remove OAuth Access
   * 💡 OAuth requires developers to register their apps with Neurosity
   * [Read full OAuth guide](/docs/api/oauth)
   *
   * Removes client-specific OAuth token for a given userId. Requires SDK to be signed in with OAuth custom token.
   *
   * ```typescript
   * await neurosity.removeOAuthAccess().catch((error) => {
   *   // handle error here...
   * });
   * ```
   * @returns custom token
   */
  public removeOAuthAccess(): Promise<OAuthRemoveResponse> {
    return this.cloudClient.removeOAuthAccess();
  }

  /**
   * <StreamingModes wifi={true} />
   *
   * Observes and returns a list of all Kinesis `experiments` and all subsequent experiment changes.
   * Here's an example of how to get a list of all Kinesis labels that have been trained:
   *
   * ```typescript
   *
   * const getUniqueLabels = (experiments) => {
   *   const labels = experiments.flatMap((experiment) => experiment.labels);
   *   // only return unique labels
   *   return [...new Set(labels)];
   * }
   *
   * neurosity.onUserExperiments().subscribe((experiments) => {
   *   console.log(experiments);
   *   console.log("labels", getUniqueLabels(experiments));
   * });
   *
   * // [{ id: '...', deviceId: '...', labels: [ 'drop' ], name: 'Lightgray cheetah', timestamp: 1577908381552, totalTrials: 16, userId: '...' }]
   * // ["drop", "lift", "push"]
   * ```
   *
   * @returns Observable of `experiments` events
   */
  public onUserExperiments(): Observable<Experiment[]> {
    return this.cloudClient.onUserExperiments();
  }

  /**
   * <StreamingModes wifi={true} />
   *
   * Deletes a specific experiment provided an experiment ID
   *
   * ```typescript
   * await neurosity.deleteUserExperiment(experiment.id);
   * ```
   *
   * @param experimentId The ID of the Experiment
   * @returns void
   */
  public deleteUserExperiment(experimentId: string): Promise<void> {
    return this.cloudClient.deleteUserExperiment(experimentId);
  }

  /**
   * <StreamingModes wifi={true} />
   *
   * Creates a new experiment owned by the authenticated user and returns its
   * generated ID. Pair with {@link Neurosity.onUserExperiments} to observe it,
   * and {@link Neurosity.updateUserExperiment} to fill in details as the user
   * works.
   *
   * ```typescript
   * const experimentId = await neurosity.createUserExperiment({
   *   deviceId: device.deviceId,
   *   name: "Left hand pinch",
   *   labels: ["leftHandPinch"]
   * });
   * ```
   *
   * @param options Experiment options (`deviceId` required; `name`/`labels` optional)
   * @returns The new experiment's ID
   */
  public createUserExperiment(
    options: CreateExperimentOptions
  ): Promise<string> {
    return this.cloudClient.createUserExperiment(options);
  }

  /**
   * <StreamingModes wifi={true} />
   *
   * Updates fields on an existing experiment (e.g. name, notes, labels,
   * totalTrials).
   *
   * ```typescript
   * await neurosity.updateUserExperiment(experimentId, {
   *   name: "Renamed experiment",
   *   labels: ["leftHandPinch", "rightHandPinch"]
   * });
   * ```
   *
   * @param experimentId The ID of the experiment
   * @param patch Partial experiment fields to merge (`id`/`userId` cannot be changed)
   * @returns void
   */
  public updateUserExperiment(
    experimentId: string,
    patch: Partial<Omit<Experiment, "id" | "userId">>
  ): Promise<void> {
    return this.cloudClient.updateUserExperiment(experimentId, patch);
  }

  /**
   * <StreamingModes wifi={true} />
   *
   * Adds a marker to an experiment recording and returns the marker's ID.
   *
   * ```typescript
   * await neurosity.addExperimentMarker(experimentId, {
   *   label: "drop",
   *   timestamp: Date.now()
   * });
   * ```
   *
   * @param experimentId The ID of the experiment
   * @param marker The marker to add (`label` and `timestamp` required)
   * @returns The new marker's ID
   */
  public addExperimentMarker(
    experimentId: string,
    marker: ExperimentMarker
  ): Promise<string> {
    return this.cloudClient.addExperimentMarker(experimentId, marker);
  }

  /**
   * <StreamingModes wifi={true} />
   *
   * Saves a training trial result for an experiment and returns the trial's ID.
   * `timestamp` defaults to a server timestamp when omitted.
   *
   * ```typescript
   * await neurosity.saveExperimentTrial(experimentId, {
   *   label: "leftHandPinch",
   *   baseline: false
   * });
   * ```
   *
   * @param experimentId The ID of the experiment
   * @param trial The trial payload
   * @returns The new trial's ID
   */
  public saveExperimentTrial(
    experimentId: string,
    trial: ExperimentTrial
  ): Promise<string> {
    return this.cloudClient.saveExperimentTrial(experimentId, trial);
  }

  /**
   * <StreamingModes wifi={true} />
   *
   * Saves a model prediction for an experiment and returns the prediction's ID.
   * `timestamp` defaults to a server timestamp when omitted.
   *
   * ```typescript
   * await neurosity.saveExperimentPrediction(experimentId, {
   *   trial: 0,
   *   label: "leftHandPinch",
   *   probability: 0.92,
   *   metric: "kinesis"
   * });
   * ```
   *
   * @param experimentId The ID of the experiment
   * @param prediction The prediction payload
   * @returns The new prediction's ID
   */
  public saveExperimentPrediction(
    experimentId: string,
    prediction: ExperimentPrediction
  ): Promise<string> {
    return this.cloudClient.saveExperimentPrediction(experimentId, prediction);
  }

  /**
   * <StreamingModes wifi={true} />
   *
   * Observes the markers dropped during an experiment recording, sorted by
   * timestamp. Each marker includes its `id`.
   *
   * ```typescript
   * neurosity.onExperimentMarkers(experimentId).subscribe((markers) => {
   *   console.log(markers);
   * });
   * ```
   *
   * @param experimentId The ID of the experiment
   * @returns Observable of the experiment's markers
   */
  public onExperimentMarkers(
    experimentId: string
  ): Observable<ExperimentMarker[]> {
    return this.cloudClient.onExperimentMarkers(experimentId);
  }

  /**
   * <StreamingModes wifi={true} />
   *
   * Sets simulated status fields on an **emulator** device (e.g. toggling
   * `state` or `charging`). Intended for emulator/dev tooling — on real
   * hardware the device owns its status.
   *
   * ```typescript
   * await neurosity.setEmulatorStatus(deviceId, { state: "online" });
   * await neurosity.setEmulatorStatus(deviceId, { charging: true });
   * ```
   *
   * @param deviceId The emulator device's ID
   * @param patch Status fields to set (`state` and/or `charging`)
   * @returns void
   */
  public setEmulatorStatus(
    deviceId: string,
    patch: EmulatorStatusPatch
  ): Promise<void> {
    return this.cloudClient.setEmulatorStatus(deviceId, patch);
  }
}
