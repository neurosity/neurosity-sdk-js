import { Observable, Subject } from "rxjs";

import { STATUS, TRANSPORT_TYPE } from "./types";
import { Action } from "../../types/actions";
import { Peripheral } from "./react-native/types/BleManagerTypes";

/**
 * @hidden
 */
export interface BluetoothTransport {
  type: TRANSPORT_TYPE;
  connect(peripheral?: Peripheral): Promise<void>;
  disconnect(): Promise<void>;
  connectionStatus(): Observable<STATUS>;
  requestDevice?(): any;
  logs$: Subject<string>;

  onDiscover?(options?: { seconds?: number }): Observable<Peripheral[]>;

  subscribeToCharacteristic(args: {
    characteristicName: string;
    manageNotifications?: boolean;
  }): Observable<any>;

  readCharacteristic(
    characteristicName: string,
    parse?: boolean
  ): Promise<any>;

  writeCharacteristic(
    characteristicName: string,
    data: string
  ): Promise<void>;

  dispatchAction(args: {
    characteristicName: string;
    action: Action;
  }): Promise<any>;
}
