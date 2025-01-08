import { Observable } from "rxjs";
import { BLUETOOTH_CONNECTION } from "./constants";

export abstract class BluetoothTransport {
  abstract device: BluetoothDevice;
  abstract server: BluetoothRemoteGATTServer;
  abstract service: BluetoothRemoteGATTService;
  abstract characteristicsByName: Record<
    string,
    BluetoothRemoteGATTCharacteristic
  >;

  abstract connection$: Observable<BLUETOOTH_CONNECTION>;
  abstract pendingActions$: Observable<Record<string, unknown>[]>;
  abstract logs$: Observable<string>;
  abstract onDisconnected$: Observable<void>;

  abstract subscribe(
    characteristicName: string,
    options?: {
      manageNotifications?: boolean;
      skipJSONDecoding?: boolean;
    }
  ): Observable<unknown>;

  protected abstract _onDisconnected(): Observable<void>;
  protected abstract _manageNotifications(
    characteristic: BluetoothRemoteGATTCharacteristic
  ): Observable<unknown>;
  protected abstract _startNotifications(
    characteristic: BluetoothRemoteGATTCharacteristic
  ): Observable<unknown>;
  protected abstract getCharacteristicByName(
    characteristicName: string
  ): Promise<BluetoothRemoteGATTCharacteristic>;
}
