import { defer, Observable } from "rxjs";
import { switchMap, take, tap } from "rxjs/operators";

import { WebBluetoothClient } from "./WebBluetoothClient";
import { csvBufferToEpoch } from "./csvBufferToEpoch";
import { DeviceInfo } from "../../types/deviceInfo";
import { Epoch } from "../../types/epoch";

export class WebBluetoothSDK {
  bleClient: WebBluetoothClient;
  deviceInfo: DeviceInfo;

  constructor() {
    this.bleClient = new WebBluetoothClient();
  }

  connect() {
    return this.bleClient.connect();
  }

  disconnect() {
    return this.bleClient.disconnect();
  }

  connectionStatus() {
    return this.bleClient.connectionStatus();
  }

  logs() {
    return this.bleClient.logs$.asObservable();
  }

  getDeviceId() {
    return this.bleClient.readCharacteristic("deviceId");
  }

  focus() {
    return this.bleClient.subscribeToCharacteristic({
      characteristicName: "focus"
    });
  }

  calm() {
    return this.bleClient.subscribeToCharacteristic({
      characteristicName: "calm"
    });
  }

  accelerometer() {
    return this.bleClient.subscribeToCharacteristic({
      characteristicName: "accelerometer"
    });
  }

  brainwaves(label: string): Observable<Epoch | any> {
    switch (label) {
      case "raw":
      case "rawUnfiltered":
        return defer(() => this.getInfo()).pipe(
          tap((info) => console.log("info", info)),
          switchMap((deviceInfo) =>
            this.bleClient
              .subscribeToCharacteristic({
                characteristicName: label
              })
              .pipe(csvBufferToEpoch(deviceInfo))
          )
        );
      default:
        return this.bleClient.subscribeToCharacteristic({
          characteristicName: label
        });
    }
  }

  signalQuality() {
    return this.bleClient.subscribeToCharacteristic({
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
      const deviceInfo = await this.bleClient
        .subscribeToCharacteristic({
          characteristicName: "deviceInfo"
        })
        .pipe(take(1))
        .toPromise();

      this.deviceInfo = deviceInfo;

      return deviceInfo;
    } catch (error) {
      console.log("getinfo error", error);
      return Promise.reject(error?.message);
    }
  }

  // Tested
  status() {
    return this.bleClient.subscribeToCharacteristic({
      characteristicName: "status"
    });
  }

  dispatchAction(action) {
    return this.bleClient.dispatchAction({
      characteristicName: "actions",
      action
    });
  }

  settings() {
    return this.bleClient.subscribeToCharacteristic({
      characteristicName: "settings"
    });
  }

  // @TODO: no backend yet - will support in future versions
  changeSettings(settings) {
    return this.bleClient.dispatchAction({
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
        this.bleClient.subscribeToCharacteristic({
          characteristicName: "wifiNearbyNetworks"
        }),

      connections: (): Observable<any> =>
        this.bleClient.subscribeToCharacteristic({
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
