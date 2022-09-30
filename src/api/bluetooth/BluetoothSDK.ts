import { defer, Observable, firstValueFrom } from "rxjs";
import { switchMap, tap } from "rxjs/operators";

import { WebBluetoothTransport } from "./web/WebBluetoothTransport";
import { ReactNativeTransport } from "./react-native/ReactNativeTransport";
import { csvBufferToEpoch } from "./utils/csvBufferToEpoch";
import { DeviceInfo } from "../../types/deviceInfo";
import { Epoch } from "../../types/epoch";
import { Peripheral } from "./react-native/types/BleManagerTypes";

type BluetoothTransport = WebBluetoothTransport | ReactNativeTransport;

type IsAuthenticated = boolean;
type ExpiresIn = number;
type IsAuthenticatedResponse = [IsAuthenticated, ExpiresIn];

type Options = {
  transport: BluetoothTransport;
};

export class BluetoothSDK {
  transport: BluetoothTransport;
  deviceInfo: DeviceInfo;

  constructor(options: Options) {
    const { transport } = options;

    if (!transport) {
      throw new Error(`No bluetooth transport provided.`);
    }

    this.transport = transport;
  }

  async authenticate(token: string): Promise<IsAuthenticatedResponse> {
    await this.transport.writeCharacteristic("auth", token);

    return this.isAuthenticated();
  }

  async isAuthenticated(): Promise<IsAuthenticatedResponse> {
    const [isAuthenticated, expiresIn] =
      await this.transport.readCharacteristic("auth", true);

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
  }

  // Argument for React Native only
  connect(peripheral?: Peripheral) {
    if (this.transport instanceof ReactNativeTransport) {
      return this.transport.connect(peripheral);
    }

    if (this.transport instanceof WebBluetoothTransport) {
      return this.transport.connect();
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

  getDeviceId() {
    return this.transport.readCharacteristic("deviceId");
  }

  focus() {
    return this.transport.subscribeToCharacteristic({
      characteristicName: "focus"
    });
  }

  calm() {
    return this.transport.subscribeToCharacteristic({
      characteristicName: "calm"
    });
  }

  accelerometer() {
    return this.transport.subscribeToCharacteristic({
      characteristicName: "accelerometer"
    });
  }

  brainwaves(label: string): Observable<Epoch | any> {
    switch (label) {
      case "raw":
      case "rawUnfiltered":
        return defer(() => this.getInfo()).pipe(
          tap((info) => console.log("info", info)),
          switchMap((deviceInfo: DeviceInfo) =>
            this.transport
              .subscribeToCharacteristic({
                characteristicName: label
              })
              .pipe(csvBufferToEpoch(deviceInfo))
          )
        );
      default:
        return this.transport.subscribeToCharacteristic({
          characteristicName: label
        });
    }
  }

  signalQuality() {
    return this.transport.subscribeToCharacteristic({
      characteristicName: "signalQuality"
    });
  }

  addMarker(label: string) {
    this.dispatchAction({
      action: "marker",
      command: "add",
      message: {
        timestamp: Date.now(),
        label
      }
    });
  }

  // Tested
  async getInfo(): Promise<DeviceInfo> {
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
    return this.transport.subscribeToCharacteristic({
      characteristicName: "status"
    });
  }

  dispatchAction(action) {
    return this.transport.dispatchAction({
      characteristicName: "actions",
      action
    });
  }

  settings() {
    return this.transport.subscribeToCharacteristic({
      characteristicName: "settings"
    });
  }

  // @TODO: no backend yet - will support in future versions
  changeSettings(settings) {
    return this.transport.dispatchAction({
      characteristicName: "settings",
      action: settings
    });
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
        this.transport.subscribeToCharacteristic({
          characteristicName: "wifiNearbyNetworks"
        }),

      connections: (): Observable<any> =>
        this.transport.subscribeToCharacteristic({
          characteristicName: "wifiConnections"
        }),

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
