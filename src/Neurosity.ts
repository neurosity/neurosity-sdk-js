import { combineLatest, Observable, of, throwError } from "rxjs";
import { ReplaySubject, firstValueFrom } from "rxjs";
import { map, startWith, switchMap } from "rxjs/operators";
import { distinctUntilChanged } from "rxjs/operators";
import isEqual from "fast-deep-equal";
import { CloudClient, createUser } from "./api/index";
import { credentialWithLink, SERVER_TIMESTAMP } from "./api/index";
import { SDKOptions } from "./types/options";
import { STREAMING_MODE, STREAMING_TYPE } from "./types/streaming";
import { Training } from "./types/training";
import { Credentials, EmailAndPassword } from "./types/credentials";
import { CustomToken } from "./types/credentials";
import { Settings, ChangeSettings } from "./types/settings";
import { SignalQuality } from "./types/signalQuality";
import { Kinesis } from "./types/kinesis";
import { Calm } from "./types/calm";
import { Focus } from "./types/focus";
import { getLabels } from "./utils/subscription";
import { BrainwavesLabel, Epoch, PowerByBand, PSD } from "./types/brainwaves";
import { Accelerometer } from "./types/accelerometer";
import { DeviceInfo, OSVersion } from "./types/deviceInfo";
import { DeviceStatus, STATUS } from "./types/status";
import { Action } from "./types/actions";
import { HapticEffects } from "./types/hapticEffects";
import * as errors from "./utils/errors";
import * as platform from "./utils/platform";
import * as hapticEffects from "./utils/hapticEffects";
import { validateOAuthScopeForFunctionName } from "./utils/oauth";
import { validateOAuthScopeForAction } from "./utils/oauth";
import { createOAuthURL } from "./api/https/createOAuthURL";
import { getOAuthToken } from "./api/https/getOAuthToken";
import { OAuthConfig, OAuthQuery } from "./types/oauth";
import { OAuthQueryResult, OAuthRemoveResponse } from "./types/oauth";
import { UserClaims } from "./types/user";
import { isNode } from "./utils/is-node";
import { getCloudMetric } from "./utils/metrics";
import { Experiment } from "./types/experiment";
import { TransferDeviceOptions } from "./utils/transferDevice";
import { BluetoothClient, osHasBluetoothSupport } from "./api/bluetooth";
import { BLUETOOTH_CONNECTION } from "./api/bluetooth/types";

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
  static credentialWithLink = credentialWithLink;

  /**
   *
   * @hidden
   */
  static createUser = createUser;

  /**
   *
   * @hidden
   */
  static SERVER_TIMESTAMP = SERVER_TIMESTAMP;

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
   * @internal
   * Not user facing yet
   */
  public addDevice(deviceId: string): Promise<void> {
    const [hasOAuthError, OAuthError] = validateOAuthScopeForFunctionName(
      this.cloudClient.userClaims,
      "addDevice"
    );

    if (hasOAuthError) {
      return Promise.reject(OAuthError);
    }

    return this.cloudClient.addDevice(deviceId);
  }

  /**
   * @internal
   * Not user facing yet
   */
  public removeDevice(deviceId: string): Promise<void> {
    const [hasOAuthError, OAuthError] = validateOAuthScopeForFunctionName(
      this.cloudClient.userClaims,
      "removeDevice"
    );

    if (hasOAuthError) {
      return Promise.reject(OAuthError);
    }

    return this.cloudClient.removeDevice(deviceId);
  }

  /**
   * @internal
   * Not user facing yet
   */
  public transferDevice(options: TransferDeviceOptions): Promise<void> {
    const [hasOAuthError, OAuthError] = validateOAuthScopeForFunctionName(
      this.cloudClient.userClaims,
      "transferDevice"
    );

    if (hasOAuthError) {
      return Promise.reject(OAuthError);
    }

    return this.cloudClient.transferDevice(options);
  }

  /**
   * @internal
   * Not user facing yet
   */
  public onUserDevicesChange(): Observable<DeviceInfo[]> {
    const [hasOAuthError, OAuthError] = validateOAuthScopeForFunctionName(
      this.cloudClient.userClaims,
      "onUserDevicesChange"
    );

    if (hasOAuthError) {
      return throwError(() => OAuthError);
    }

    return this.cloudClient.onUserDevicesChange();
  }

  /**
   * @internal
   * Not user facing yet
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
    const [hasOAuthError, OAuthError] = validateOAuthScopeForFunctionName(
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
    const [hasOAuthError, OAuthError] = validateOAuthScopeForFunctionName(
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

    const [hasOAuthError, OAuthError] = validateOAuthScopeForFunctionName(
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
    const [hasOAuthError, OAuthError] = validateOAuthScopeForFunctionName(
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

    const [hasOAuthError, OAuthError] = validateOAuthScopeForAction(
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

    const [hasOAuthError, OAuthError] = validateOAuthScopeForFunctionName(
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
    const [hasOAuthError, OAuthError] = validateOAuthScopeForFunctionName(
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
    const [hasOAuthError, OAuthError] = validateOAuthScopeForFunctionName(
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

    const [hasOAuthError, OAuthError] = validateOAuthScopeForFunctionName(
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
    const [hasOAuthError, OAuthError] = validateOAuthScopeForFunctionName(
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
    const [hasOAuthError, OAuthError] = validateOAuthScopeForFunctionName(
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
    const [hasOAuthError, OAuthError] = validateOAuthScopeForFunctionName(
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

    const [hasOAuthError, OAuthError] = validateOAuthScopeForFunctionName(
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
   * @param label Name of metric properties to filter by
   * @returns Observable of predictions metric events
   */
  public predictions(label: string): Observable<any> {
    const metric = "predictions";

    const [hasOAuthError, OAuthError] = validateOAuthScopeForFunctionName(
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
    const [hasOAuthError, OAuthError] = validateOAuthScopeForFunctionName(
      this.cloudClient.userClaims,
      "status"
    );

    if (hasOAuthError) {
      return throwError(() => OAuthError);
    }

    return this._withStreamingModeObservable({
      wifi: () => this.cloudClient.status(),
      bluetooth: () => this.bluetoothClient.status()
    });
  }

  /**
   * @internal
   * Not user facing yet
   *
   * <StreamingModes wifi={true} />
   *
   * Changes device settings programmatically. These settings can be
   * also changed from the developer console under device settings.
   *
   * Available settings [[ChangeSettings]]
   *
   * Example
   * ```typescript
   * neurosity.changeSettings({
   *   lsl: true
   * });
   * ```
   */
  public async changeSettings(settings: ChangeSettings): Promise<void> {
    if (!(await this.cloudClient.didSelectDevice())) {
      return Promise.reject(errors.mustSelectDevice);
    }

    const [hasOAuthError, OAuthError] = validateOAuthScopeForFunctionName(
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
   * @internal
   * Not user facing yet
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
   * @internal
   * Not user facing yet
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
    return this.cloudClient.createCustomToken();
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
   * [Read full OAuth guide](/docs/oauth)
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
    if (!isNode) {
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
   * [Read full OAuth guide](/docs/oauth)
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
    if (!isNode) {
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
   * [Read full OAuth guide](/docs/oauth)
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
}

/**
 * @hidden
 * Deprecated class kept for backwards compatibility purposes.
 */
export class Notion extends Neurosity {
  constructor(options: SDKOptions = {}) {
    super(options);
    console.log(
      `The Notion class is deprecated and will be removed in the next version of the SDK. Please use the Neurosity class instead. e.g. new Notion() => new Neurosity()`
    );
  }
}

/**
 * @hidden
 * Internal use only. Will be removed in next versions.
 */
export { __firebase } from "./api/firebase";
