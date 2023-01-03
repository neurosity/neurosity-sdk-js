import { Observable, Subject } from "rxjs";

import { BLUETOOTH_CONNECTION, TRANSPORT_TYPE } from "./types";
import { Action } from "../../types/actions";
import { DeviceInfo } from "../../types/deviceInfo";
import { Peripheral } from "./react-native/types/BleManagerTypes";

export type DeviceNicknameOrPeripheral = string | Peripheral;

/**
 * @hidden
 */
export interface BluetoothTransport {
  type: TRANSPORT_TYPE;
  connect(
    deviceNicknameORPeripheral?: DeviceNicknameOrPeripheral
  ): Promise<void>;
  _autoConnect(selectedDevice$: Observable<DeviceInfo>): Observable<void>;
  disconnect(): Promise<void>;
  connection(): Observable<BLUETOOTH_CONNECTION>;
  requestDevice?(): any;
  addLog: (log: string) => void;
  logs$: Subject<string>;

  // React Native only
  scan?(options?: { seconds?: number }): Observable<Peripheral[]>;
  toggleAutoConnection?(value: boolean);

  subscribeToCharacteristic(args: {
    characteristicName: string;
    manageNotifications?: boolean;
  }): Observable<any>;

  readCharacteristic(characteristicName: string, parse?: boolean): Promise<any>;

  writeCharacteristic(characteristicName: string, data: string): Promise<void>;

  dispatchAction(args: {
    characteristicName: string;
    action: Action;
  }): Promise<any>;
}
