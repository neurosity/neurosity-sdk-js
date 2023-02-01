import { defer, Observable, timer } from "rxjs";
import { ReplaySubject, firstValueFrom, EMPTY } from "rxjs";
import { switchMap, share, tap, distinctUntilChanged } from "rxjs/operators";

import { WebBluetoothTransport } from "./web/WebBluetoothTransport";
import { ReactNativeTransport } from "./react-native/ReactNativeTransport";
import { binaryBufferToEpoch } from "./utils/binaryBufferToEpoch";
import { DeviceInfo } from "../../types/deviceInfo";
import { Action } from "../../types/actions";
import { Epoch } from "../../types/epoch";
import { BLUETOOTH_CONNECTION } from "./types";
import { DeviceNicknameOrPeripheral } from "./BluetoothTransport";
import { Peripheral } from "./react-native/types/BleManagerTypes";

export type BluetoothTransport = WebBluetoothTransport | ReactNativeTransport;

type IsAuthenticated = boolean;
type ExpiresIn = number;
type IsAuthenticatedResponse = [IsAuthenticated, ExpiresIn];

type CreateBluetoothToken = () => Promise<string>;

type Options = {
  transport: BluetoothTransport;
  selectedDevice$: Observable<DeviceInfo>;
  osHasBluetoothSupport$: Observable<boolean>;
  createBluetoothToken: CreateBluetoothToken;
};

export class BluetoothClient {
  transport: BluetoothTransport;
  deviceInfo: DeviceInfo;
  selectedDevice$ = new ReplaySubject<DeviceInfo>(1);
  osHasBluetoothSupport$ = new ReplaySubject<boolean>(1);
  isAuthenticated$ = new ReplaySubject<IsAuthenticated>(1);

  _focus$: Observable<any>;
  _calm$: Observable<any>;
  _accelerometer$: Observable<any>;
  _brainwavesRaw$: Observable<any>;
  _brainwavesRawUnfiltered$: Observable<any>;
  _brainwavesPSD$: Observable<any>;
  _brainwavesPowerByBand$: Observable<any>;
  _signalQuality$: Observable<any>;
  _status$: Observable<any>;
  _settings$: Observable<any>;
  _wifiNearbyNetworks$: Observable<any>;
  _wifiConnections$: Observable<any>;

  constructor(options: Options) {
    const {
      transport,
      selectedDevice$,
      osHasBluetoothSupport$,
      createBluetoothToken
    } = options ?? {};

    if (!transport) {
      throw new Error(`No bluetooth transport provided.`);
    }

    this.transport = transport;

    // Pass events to the internal selectedDevice$ if selectedDevice$ is passed via options
    if (selectedDevice$) {
      selectedDevice$.subscribe(this.selectedDevice$);
    }

    // Pass events to the internal osHasBluetoothSupport$ if osHasBluetoothSupport$ is passed via options
    if (osHasBluetoothSupport$) {
      osHasBluetoothSupport$.subscribe(this.osHasBluetoothSupport$);
    }

    this.osHasBluetoothSupport$
      .pipe(
        switchMap((osHasBluetoothSupport: boolean) =>
          osHasBluetoothSupport
            ? this.transport._autoConnect(this.selectedDevice$)
            : EMPTY
        )
      )
      .subscribe({
        error: (error: Error) => {
          this.transport.addLog(
            `Auto connect: error -> ${error?.message ?? error}`
          );
        }
      });

    // Auto authentication
    if (typeof createBluetoothToken === "function") {
      this.transport.addLog("Auto authentication enabled");
      this._autoAuthenticate(createBluetoothToken).subscribe();
    } else {
      this.transport.addLog("Auto authentication not enabled");
    }

    // Auto manage action notifications
    this.osHasBluetoothSupport$
      .pipe(
        switchMap((osHasBluetoothSupport: boolean) =>
          osHasBluetoothSupport
            ? this.transport._autoToggleActionNotifications()
            : EMPTY
        )
      )
      .subscribe();

    // Multicast metrics (share)
    this._focus$ = this._subscribeWhileAuthenticated("focus");
    this._calm$ = this._subscribeWhileAuthenticated("calm");
    this._accelerometer$ = this._subscribeWhileAuthenticated("accelerometer");
    this._brainwavesRaw$ = this._subscribeWhileAuthenticated(
      "raw",
      true // skipJSONDecoding
    );
    this._brainwavesRawUnfiltered$ = this._subscribeWhileAuthenticated(
      "rawUnfiltered",
      true // skipJSONDecoding
    );
    this._brainwavesPSD$ = this._subscribeWhileAuthenticated("psd");
    this._brainwavesPowerByBand$ =
      this._subscribeWhileAuthenticated("powerByBand");
    this._signalQuality$ = this._subscribeWhileAuthenticated("signalQuality");
    this._status$ = this._subscribeWhileAuthenticated("status");
    this._settings$ = this._subscribeWhileAuthenticated("settings");
    this._wifiNearbyNetworks$ =
      this._subscribeWhileAuthenticated("wifiNearbyNetworks");
    this._wifiConnections$ =
      this._subscribeWhileAuthenticated("wifiConnections");
  }

  _autoAuthenticate(createBluetoothToken: CreateBluetoothToken) {
    const REAUTHENTICATE_INTERVAL = 3600000; // 1 hour
    const reauthenticateInterval$ = timer(0, REAUTHENTICATE_INTERVAL).pipe(
      tap(() => {
        this.transport.addLog(`Auto authentication in progress...`);
      })
    );

    return this.osHasBluetoothSupport$.pipe(
      switchMap((osHasBluetoothSupport) =>
        osHasBluetoothSupport ? this.connection() : EMPTY
      ),
      switchMap((connection) =>
        connection === BLUETOOTH_CONNECTION.CONNECTED
          ? reauthenticateInterval$
          : EMPTY
      ),
      switchMap(async () => await this.isAuthenticated()),
      tap(async ([isAuthenticated]) => {
        if (!isAuthenticated) {
          const token = await createBluetoothToken();
          await this.authenticate(token);
        } else {
          this.transport.addLog(`Already authenticated`);
        }
      })
    );
  }

  enableAutoConnect(autoConnect: boolean): void {
    this.transport.enableAutoConnect(autoConnect);
  }

  async _hasBluetoothSupport(): Promise<boolean> {
    return await firstValueFrom(this.osHasBluetoothSupport$);
  }

  async authenticate(token: string): Promise<IsAuthenticatedResponse> {
    const hasBluetoothSupport = await this._hasBluetoothSupport();
    if (!hasBluetoothSupport) {
      const errorMessage = `authenticate method: The OS version does not support Bluetooth.`;
      this.transport.addLog(errorMessage);
      return Promise.reject(errorMessage);
    }

    await this.transport.writeCharacteristic("auth", token);

    const isAuthenticatedResponse = await this.isAuthenticated();

    const [isAuthenticated] = isAuthenticatedResponse;

    this.transport.addLog(
      `Authentication ${isAuthenticated ? "succeeded" : "failed"}`
    );

    this.isAuthenticated$.next(isAuthenticated);

    return isAuthenticatedResponse;
  }

  async isAuthenticated(): Promise<IsAuthenticatedResponse> {
    try {
      const [isAuthenticated, expiresIn] =
        await this.transport.readCharacteristic("auth", true);

      this.isAuthenticated$.next(isAuthenticated);

      return [isAuthenticated, expiresIn];
    } catch (error) {
      const failedResponse: IsAuthenticatedResponse = [false, null];

      this.transport.addLog(`Authentication error -> ${error}`);

      this.isAuthenticated$.next(false);

      return failedResponse;
    }
  }

  // Method for React Native only
  scan(options?) {
    if (this.transport instanceof ReactNativeTransport) {
      return this.transport.scan(options);
    }

    if (this.transport instanceof WebBluetoothTransport) {
      throw new Error(
        `scan method is compatibly with the React Native transport only`
      );
    }

    throw new Error(`unknown transport`);
  }

  // Argument for React Native only
  connect(deviceNicknameORPeripheral?: DeviceNicknameOrPeripheral) {
    if (this.transport instanceof ReactNativeTransport) {
      return this.transport.connect(deviceNicknameORPeripheral as Peripheral);
    }

    if (this.transport instanceof WebBluetoothTransport) {
      return deviceNicknameORPeripheral
        ? this.transport.connect(deviceNicknameORPeripheral as string)
        : this.transport.connect();
    }
  }

  disconnect() {
    return this.transport.disconnect();
  }

  connection() {
    return this.transport.connection();
  }

  logs() {
    return this.transport.logs$.asObservable();
  }

  async getDeviceId(): Promise<string> {
    // This is a public characteristic and does not require authentication
    return this.transport.readCharacteristic("deviceId");
  }

  async _withAuthentication<T>(getter: () => Promise<T>): Promise<T> {
    // First check if the OS supports Bluetooth before checking if the device is authenticated
    const hasBluetoothSupport = await this._hasBluetoothSupport();
    if (!hasBluetoothSupport) {
      const errorMessage = `The OS version does not support Bluetooth.`;
      this.transport.addLog(errorMessage);
      return Promise.reject(errorMessage);
    }

    const isAuthenticated = await firstValueFrom(this.isAuthenticated$);
    if (!isAuthenticated) {
      const errorMessage = `Authentication required.`;
      this.transport.addLog(errorMessage);
      return Promise.reject(errorMessage);
    }

    return await getter();
  }

  _subscribeWhileAuthenticated(
    characteristicName: string,
    skipJSONDecoding = false
  ): Observable<any> {
    return this.osHasBluetoothSupport$.pipe(
      switchMap((osHasBluetoothSupport) =>
        osHasBluetoothSupport ? this.isAuthenticated$ : EMPTY
      ),
      distinctUntilChanged(),
      switchMap((isAuthenticated) =>
        isAuthenticated
          ? this.transport.subscribeToCharacteristic({
              characteristicName,
              skipJSONDecoding
            })
          : EMPTY
      ),
      share()
    );
  }

  focus() {
    return this._focus$;
  }

  calm() {
    return this._calm$;
  }

  accelerometer() {
    return this._accelerometer$;
  }

  brainwaves(label: string): Observable<Epoch | any> {
    switch (label) {
      default:
      case "raw":
        return defer(() => this.getInfo()).pipe(
          switchMap((deviceInfo: DeviceInfo) =>
            this._brainwavesRaw$.pipe(binaryBufferToEpoch(deviceInfo))
          )
        );

      case "rawUnfiltered":
        return defer(() => this.getInfo()).pipe(
          switchMap((deviceInfo: DeviceInfo) =>
            this._brainwavesRawUnfiltered$.pipe(binaryBufferToEpoch(deviceInfo))
          )
        );

      case "psd":
        return this._brainwavesPSD$;

      case "powerByBand":
        return this._brainwavesPowerByBand$;
    }
  }

  signalQuality() {
    return this._signalQuality$;
  }

  async addMarker(label: string): Promise<void> {
    await this.dispatchAction({
      action: "marker",
      command: "add",
      message: {
        timestamp: Date.now(),
        label
      }
    });
  }

  async getInfo(): Promise<DeviceInfo> {
    return await this._withAuthentication(() =>
      firstValueFrom(
        this.transport.subscribeToCharacteristic({
          characteristicName: "deviceInfo"
        })
      )
    );
  }

  status() {
    return this._status$;
  }

  async dispatchAction(action: Action): Promise<any> {
    return await this._withAuthentication(() =>
      this.transport.dispatchAction({
        characteristicName: "actions",
        action
      })
    );
  }

  settings() {
    return this._settings$;
  }

  haptics(effects) {
    const metric = "haptics";

    return this.dispatchAction({
      action: metric,
      command: "queue",
      responseRequired: true,
      responseTimeout: 4000,
      //  @TODO: implement validation logic as per SDK
      message: { effects }
    });
  }

  get wifi() {
    return {
      nearbyNetworks: (): Observable<any> => this._wifiNearbyNetworks$,

      connections: (): Observable<any> => this._wifiConnections$,

      connect: (ssid: string, password?: string) => {
        if (!ssid) {
          return Promise.reject(`Missing ssid`);
        }

        return this.dispatchAction({
          action: "wifi",
          command: "connect",
          responseRequired: true,
          responseTimeout: 1000 * 60 * 2, // 2 minutes
          message: {
            ssid,
            password: password ?? null
          }
        });
      },

      forgetConnection: (ssid: string): Promise<any> => {
        if (!ssid) {
          return Promise.reject(`Missing ssid`);
        }

        return this.dispatchAction({
          action: "wifi",
          command: "forget-connection",
          responseRequired: true,
          responseTimeout: 1000 * 15, // 15 seconds
          message: {
            ssid
          }
        });
      },

      reset: () => {
        return this.dispatchAction({
          action: "wifi",
          command: "reset",
          responseRequired: true,
          responseTimeout: 1000 * 30, // 30 seconds
          message: {
            // without this, the action will resolve as soon as the
            // action is received by the OS
            respondOnSuccess: true
          }
        });
      },

      speedTest: () => {
        return this.dispatchAction({
          action: "wifi",
          command: "speed-test",
          responseRequired: true,
          responseTimeout: 1000 * 60 * 1 // 1 minute
        });
      }
    };
  }
}
