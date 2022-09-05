import { Observable } from "rxjs";

import { WebBluetoothClient } from "./WebBluetoothClient";

export class WebBluetoothSDK {
  bleClient: WebBluetoothClient;

  constructor() {
    this.bleClient = new WebBluetoothClient();
  }

  connect() {
    return this.bleClient.connect();
  }

  connectionStatus() {
    return this.bleClient.connectionStatus();
  }

  logs() {
    return this.bleClient.logs.asObservable();
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

  brainwaves(label: string) {
    return this.bleClient.subscribeToCharacteristic({
      characteristicName: label
    });
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
  getInfo(): Promise<any> {
    return this.bleClient
      .subscribeToCharacteristic({
        characteristicName: "deviceInfo"
      })
      .toPromise();
  }

  // Tested
  status() {
    return this.bleClient.subscribeToCharacteristic({
      characteristicName: "status"
    });
  }

  // Tested
  dispatchAction(action) {
    return this.bleClient.dispatchAction({
      characteristicName: "actions",
      action
    });
  }

  // @TODO: no backend yet
  settings() {
    return this.bleClient.subscribeToCharacteristic({
      characteristicName: "settings"
    });
  }

  // @TODO: no backend yet
  changeSettings(settings) {
    return this.bleClient.dispatchAction({
      characteristicName: "settings",
      action: settings
    });
  }

  // Only works once - not resolving response
  haptics(effects) {
    const metric = "haptics";

    return this.dispatchAction({
      action: metric,
      command: "queue",
      responseRequired: true,
      responseTimeout: 2000,
      //  @TODO: implement validation logic as per SDK
      message: { effects }
    });
  }

  get wifi() {
    return {
      // @TODO: not working yet
      nearbyNetworks: (): Observable<any> =>
        this.bleClient.subscribeToCharacteristic({
          characteristicName: "nearbyWifiNetworks"
        }),

      // @TODO: not working yet
      connect: (ssid: string, password: string) => {
        if (!ssid) {
          return Promise.reject(`Missing ssid`);
        }

        if (!password) {
          return Promise.reject(`Missing ssid`);
        }

        return this.dispatchAction({
          action: "wifi",
          command: "connect",
          responseRequired: true,
          responseTimeout: 1000 * 60 * 2, // 2 minutes
          message: {
            ssid,
            password
          }
        });
      },

      // @TODO: not working yet
      forgetNetwork: (ssid: string): Promise<any> => {
        if (!ssid) {
          return Promise.reject(`Missing ssid`);
        }

        return this.dispatchAction({
          action: "wifi",
          command: "forget-network",
          responseRequired: true,
          responseTimeout: 1000 * 10, // 10 seconds
          message: {
            ssid
          }
        });
      },

      // @TODO: not working yet
      getCurrentNetwork: (): Promise<any> => {
        return this.dispatchAction({
          action: "wifi",
          command: "current-network",
          responseRequired: true,
          responseTimeout: 1000 * 3 // 3 seconds
        });
      },

      // @TODO: not working yet
      listConnections: (): Promise<any> => {
        return this.dispatchAction({
          action: "wifi",
          command: "list-connections",
          responseRequired: true,
          responseTimeout: 1000 * 10 // 10 seconds
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
      }
    };
  }
}
