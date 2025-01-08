import { Observable, BehaviorSubject, ReplaySubject, NEVER, defer } from "rxjs";
import { share, map, mergeMap } from "rxjs/operators";
import { fromEventPattern } from "rxjs";
import { BluetoothTransport } from "../BluetoothTransport";
import { BLUETOOTH_CONNECTION } from "../constants";
import { isWebBluetoothSupported } from "./isWebBluetoothSupported";

type BluetoothEventListener = (event: Event) => void;

export class WebBluetoothTransport extends BluetoothTransport {
  device!: BluetoothDevice;
  server!: BluetoothRemoteGATTServer;
  service!: BluetoothRemoteGATTService;
  characteristicsByName: Record<string, BluetoothRemoteGATTCharacteristic> = {};

  connection$ = new BehaviorSubject<
    (typeof BLUETOOTH_CONNECTION)[keyof typeof BLUETOOTH_CONNECTION]
  >(BLUETOOTH_CONNECTION.DISCONNECTED);
  pendingActions$ = new BehaviorSubject<Record<string, unknown>[]>([]);
  logs$ = new ReplaySubject<string>(10);
  onDisconnected$: Observable<void> = this._onDisconnected().pipe(share());

  constructor() {
    super();
    if (!isWebBluetoothSupported()) {
      throw new Error("Web Bluetooth is not supported");
    }
  }

  subscribe(
    characteristicName: string,
    options: {
      manageNotifications?: boolean;
      skipJSONDecoding?: boolean;
    } = {}
  ): Observable<unknown> {
    const { manageNotifications = true, skipJSONDecoding = false } = options;

    const data$ = defer(() =>
      this.getCharacteristicByName(characteristicName)
    ).pipe(
      mergeMap((characteristic) => {
        if (manageNotifications) {
          return this._manageNotifications(characteristic);
        }
        return this._startNotifications(characteristic);
      })
    );

    if (skipJSONDecoding) {
      return data$;
    }

    return data$.pipe(
      map((value) => {
        if (value instanceof Uint8Array) {
          return new TextDecoder().decode(value);
        }
        return value;
      }),
      map((value) => {
        if (typeof value === "string") {
          try {
            return JSON.parse(value);
          } catch (error) {
            return value;
          }
        }
        return value;
      })
    );
  }

  protected _onDisconnected(): Observable<void> {
    return this.connection$.pipe(
      mergeMap((connection) =>
        connection === BLUETOOTH_CONNECTION.CONNECTED
          ? fromEventPattern<void>(
              (handler) => {
                if (this.device) {
                  this.device.addEventListener(
                    "gattserverdisconnected",
                    handler as BluetoothEventListener
                  );
                }
              },
              (handler) => {
                if (this.device) {
                  this.device.removeEventListener(
                    "gattserverdisconnected",
                    handler as BluetoothEventListener
                  );
                }
              }
            )
          : NEVER
      )
    );
  }

  protected _manageNotifications(
    characteristic: BluetoothRemoteGATTCharacteristic
  ): Observable<unknown> {
    return new Observable((subscriber) => {
      characteristic
        .startNotifications()
        .then(() => {
          const onCharacteristicValueChanged = (event: Event) => {
            const target = event.target as BluetoothRemoteGATTCharacteristic;
            if (target?.value) {
              subscriber.next(target.value.buffer);
            }
          };

          characteristic.addEventListener(
            "characteristicvaluechanged",
            onCharacteristicValueChanged
          );

          return () => {
            characteristic
              .stopNotifications()
              .then(() => {
                characteristic.removeEventListener(
                  "characteristicvaluechanged",
                  onCharacteristicValueChanged
                );
              })
              .catch((error) => {
                subscriber.error(error);
              });
          };
        })
        .catch((error) => {
          subscriber.error(error);
        });
    });
  }

  protected _startNotifications(
    characteristic: BluetoothRemoteGATTCharacteristic
  ): Observable<unknown> {
    return fromEventPattern<Event>(
      (handler) => {
        characteristic.addEventListener("characteristicvaluechanged", handler);
      },
      (handler) => {
        characteristic.removeEventListener(
          "characteristicvaluechanged",
          handler
        );
      }
    ).pipe(
      map((event) => {
        const target = event.target as BluetoothRemoteGATTCharacteristic;
        return target?.value?.buffer;
      })
    );
  }

  protected async getCharacteristicByName(
    characteristicName: string
  ): Promise<BluetoothRemoteGATTCharacteristic> {
    const characteristic = this.characteristicsByName[characteristicName];
    if (!characteristic) {
      throw new Error(`Characteristic ${characteristicName} not found`);
    }
    return characteristic;
  }
}
