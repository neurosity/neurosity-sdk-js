import { defer, Observable, firstValueFrom } from "rxjs";
import { Subject, ReplaySubject, EMPTY, NEVER } from "rxjs";
import { catchError, distinctUntilChanged, switchMap } from "rxjs/operators";

import { WebBluetoothTransport } from "./web/WebBluetoothTransport";
import { ReactNativeTransport } from "./react-native/ReactNativeTransport";
import { Peripheral } from "./react-native/types/BleManagerTypes";
import { csvBufferToEpoch } from "./utils/csvBufferToEpoch";
import { DeviceInfo } from "../../types/deviceInfo";
import { Action } from "../../types/actions";
import { Epoch } from "../../types/epoch";
import { STATUS } from "./types";

export type BluetoothTransport = WebBluetoothTransport | ReactNativeTransport;

type IsAuthenticated = boolean;
type ExpiresIn = number;
type IsAuthenticatedResponse = [IsAuthenticated, ExpiresIn];

type Options = {
  transport: BluetoothTransport;
  selectedDevice$?: Observable<DeviceInfo>;
};

export class BluetoothClient {
  transport: BluetoothTransport;
  deviceInfo: DeviceInfo;
  selectedDevice$ = new Subject<DeviceInfo>();

  isAuthenticated$ = new ReplaySubject<IsAuthenticated>(1);

  constructor(options: Options) {
    const { transport } = options;

    if (!transport) {
      throw new Error(`No bluetooth transport provided.`);
    }

    this.transport = transport;

    // Pass events to the internal selectedDevice$ if selectedDevice$ is passed via options
    if (options.selectedDevice$) {
      options.selectedDevice$.subscribe(this.selectedDevice$);
    }

    // Auto Connect
    this.transport
      ._autoConnect(this.selectedDevice$)
      .pipe(
        catchError((error) => {
          console.log("ERROR _autoConnect", error);

          // @TODO: handle retries
          return NEVER;
        })
      )
      .subscribe({
        error: (error: Error) => {
          this.transport.addLog(
            `Auto connect: error -> ${error?.message ?? error}`
          );
        }
      });

    // check if authenticated, which updates the isAuthenticated$ subject
    this.connectionStatus()
      .pipe(
        switchMap((status) =>
          status === STATUS.CONNECTED ? this.isAuthenticated() : EMPTY
        )
      )
      .subscribe();
  }

  async authenticate(token: string): Promise<IsAuthenticatedResponse> {
    await this.transport.writeCharacteristic("auth", token);

    const isAuthenticatedResponse = await this.isAuthenticated();

    const [isAuthenticated] = isAuthenticatedResponse;

    this.isAuthenticated$.next(isAuthenticated);

    return isAuthenticatedResponse;
  }

  async isAuthenticated(): Promise<IsAuthenticatedResponse> {
    const [isAuthenticated, expiresIn] =
      await this.transport.readCharacteristic("auth", true);

    this.isAuthenticated$.next(isAuthenticated);

    return [isAuthenticated, expiresIn];
  }

  // Method for React Native only
  onDiscover() {
    if (this.transport instanceof ReactNativeTransport) {
      return this.transport.onDiscover();
    }

    if (this.transport instanceof WebBluetoothTransport) {
      throw new Error(
        `onDiscover method is compatibly with the React Native transport only`
      );
    }

    throw new Error(`unknown transport`);
  }

  // Argument for React Native only
  connect(deviceNicknameORPeripheral?) {
    if (this.transport instanceof ReactNativeTransport) {
      return this.transport.connect(deviceNicknameORPeripheral);
    }

    if (this.transport instanceof WebBluetoothTransport) {
      return deviceNicknameORPeripheral
        ? this.transport.connect(deviceNicknameORPeripheral)
        : this.transport.connect();
    }
  }

  disconnect() {
    return this.transport.disconnect();
  }

  connectionStatus() {
    return this.transport.connectionStatus();
  }

  logs() {
    return this.transport.logs$.asObservable();
  }

  async getDeviceId(): Promise<string> {
    const isAuthenticated = await firstValueFrom(this.isAuthenticated$);

    if (!isAuthenticated) {
      return Promise.reject(`Authentication required.`);
    }

    return this.transport.readCharacteristic("deviceId");
  }

  _subscribeWhileAuthenticated(characteristicName: string): Observable<any> {
    return this.isAuthenticated$.pipe(
      distinctUntilChanged(),
      switchMap((isAuthenticated) =>
        isAuthenticated
          ? this.transport.subscribeToCharacteristic({
              characteristicName
            })
          : EMPTY
      )
    );
  }

  focus() {
    return this._subscribeWhileAuthenticated("focus");
  }

  calm() {
    return this._subscribeWhileAuthenticated("calm");
  }

  accelerometer() {
    return this._subscribeWhileAuthenticated("accelerometer");
  }

  brainwaves(label: string): Observable<Epoch | any> {
    switch (label) {
      case "raw":
      case "rawUnfiltered":
        return defer(() => this.getInfo()).pipe(
          switchMap((deviceInfo: DeviceInfo) =>
            this._subscribeWhileAuthenticated(label).pipe(
              csvBufferToEpoch(deviceInfo)
            )
          )
        );
      default:
        return this._subscribeWhileAuthenticated(label);
    }
  }

  signalQuality() {
    return this._subscribeWhileAuthenticated("signalQuality");
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
    const isAuthenticated = await firstValueFrom(this.isAuthenticated$);

    if (!isAuthenticated) {
      return Promise.reject(`Authentication required.`);
    }

    // cache for later
    if (this.deviceInfo) {
      return Promise.resolve(this.deviceInfo);
    }

    try {
      const deviceInfo = await firstValueFrom(
        this.transport.subscribeToCharacteristic({
          characteristicName: "deviceInfo"
        })
      );

      this.deviceInfo = deviceInfo;

      return deviceInfo;
    } catch (error) {
      console.log("getinfo error", error);
      return Promise.reject(error?.message);
    }
  }

  // Tested
  status() {
    return this._subscribeWhileAuthenticated("status");
  }

  async dispatchAction(action: Action): Promise<any> {
    const isAuthenticated = await firstValueFrom(this.isAuthenticated$);

    if (!isAuthenticated) {
      return Promise.reject(`Authentication required.`);
    }

    try {
      return await this.transport.dispatchAction({
        characteristicName: "actions",
        action
      });
    } catch (error) {
      return Promise.reject(error?.messge ?? error);
    }
  }

  settings() {
    return this._subscribeWhileAuthenticated("settings");
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
      nearbyNetworks: (): Observable<any> =>
        this._subscribeWhileAuthenticated("wifiNearbyNetworks"),

      connections: (): Observable<any> =>
        this._subscribeWhileAuthenticated("wifiConnections"),

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
