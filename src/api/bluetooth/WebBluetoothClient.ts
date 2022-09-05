import { BLUETOOTH_CHARACTERISTICS } from "@neurosity/ipk";
import { BLUETOOTH_PRIMARY_SERVICE_UUID_HEX } from "@neurosity/ipk";
import { BLUETOOTH_CHUNK_DELIMITER } from "@neurosity/ipk";
import { BLUETOOTH_DEVICE_NAME_PREFIXES } from "@neurosity/ipk";
import { BLUETOOTH_COMPANY_IDENTIFIER_HEX } from "@neurosity/ipk";
import { BehaviorSubject, Subject, timer } from "rxjs";
import { from, fromEventPattern, Observable, NEVER } from "rxjs";
import { switchMap, mergeMap, map, filter, take } from "rxjs/operators";
import { shareReplay, distinctUntilChanged } from "rxjs/operators";

import { stitchChunks } from "./stitch";

const namePrefixes = BLUETOOTH_DEVICE_NAME_PREFIXES.map(
  (namePrefix) => ({
    namePrefix
  })
);

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8");

const DEFAULT_ACTION_RESPONSE_TIMEOUT = 1000 * 60; // 1 minute

// Reverse BLUETOOTH_CHARACTERISTICS key/values for easy lookup
const characteristicsUUIDsToNames = Object.fromEntries(
  Object.entries(BLUETOOTH_CHARACTERISTICS).map((entries) =>
    entries.reverse()
  )
);

type ActionOptions = {
  characteristicName: string;
  action: any;
};

type SubscribeOptions = {
  characteristicName: string;
  manageNotifications?: boolean;
};

export enum STATUS {
  CONNECTED = "connected",
  CONNECTING = "connecting",
  DISCONNECTING = "disconnecting",
  DISCONNECTED = "disconnected"
}

export class WebBluetoothClient {
  device: BluetoothDevice;
  server: BluetoothRemoteGATTServer;
  service: BluetoothRemoteGATTService;
  characteristicsByName: {
    [name: string]: BluetoothRemoteGATTCharacteristic;
  } = {};

  logs: Subject<string> = new Subject();
  status$: BehaviorSubject<STATUS> = new BehaviorSubject(
    STATUS.DISCONNECTED
  );
  pendingActions$: BehaviorSubject<any[]> = new BehaviorSubject([]);

  constructor() {
    this.status$.asObservable().subscribe((status) => {
      this.addLog(`status is ${status}`);
    });
  }

  addLog(log: string) {
    this.logs.next(log);
  }

  isConnected() {
    const status = this.status$.getValue();
    return status === STATUS.CONNECTED;
  }

  connectionStatus(): Observable<STATUS> {
    return this.status$.asObservable().pipe(
      filter((status) => !!status),
      distinctUntilChanged(),
      shareReplay(1)
    );
  }

  async connect(): Promise<void> {
    if (!("bluetooth" in navigator)) {
      const errorMessage = "Web Bluetooth is not supported";
      this.addLog(errorMessage);
      return Promise.reject(errorMessage);
    }

    try {
      this.addLog("Requesting Bluetooth Device...");

      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          ...namePrefixes,
          {
            manufacturerData: [
              {
                companyIdentifier: BLUETOOTH_COMPANY_IDENTIFIER_HEX
              }
            ]
          }
        ],
        optionalServices: [BLUETOOTH_PRIMARY_SERVICE_UUID_HEX]
      });

      this.status$.next(STATUS.CONNECTING);

      this.server = await this.device.gatt.connect();

      this.addLog(`Getting service...`);
      this.service = await this.server.getPrimaryService(
        BLUETOOTH_PRIMARY_SERVICE_UUID_HEX
      );
      this.addLog(
        `Got service ${this.service.uuid}, getting characteristics...`
      );

      const characteristicsList =
        await this.service.getCharacteristics();

      this.addLog(`Got characteristics`);

      this.characteristicsByName = Object.fromEntries(
        characteristicsList.map((characteristic) => [
          characteristicsUUIDsToNames[characteristic.uuid],
          characteristic
        ])
      );

      this.status$.next(STATUS.CONNECTED);

      this.onDisconnected().subscribe(() => {
        this.status$.next(STATUS.DISCONNECTED);
      });

      this._autoToggleActionNotifications();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  onDisconnected() {
    return fromEventPattern(
      (addHandler) => {
        this.device.addEventListener(
          "gattserverdisconnected",
          addHandler
        );
      },
      (removeHandler) => {
        this.device.removeEventListener(
          "gattserverdisconnected",
          removeHandler
        );
      }
    );
  }

  disconnect(): void {
    if (this?.device?.gatt && this.device.gatt.connected) {
      this.device.gatt?.disconnect();
    }
  }

  /**
   *
   * Bluetooth GATT attributes, services, characteristics, etc. are invalidated
   * when a device disconnects. This means your code should always retrieve
   * (through getPrimaryService(s), getCharacteristic(s), etc.) these attributes
   * after reconnecting.
   */
  async getCharacteristicByName(
    characteristicName: string
  ): Promise<BluetoothRemoteGATTCharacteristic> {
    return this.characteristicsByName?.[characteristicName];
  }

  subscribeToCharacteristic({
    characteristicName,
    manageNotifications = true
  }: SubscribeOptions): Observable<any> {
    const data$ = from(
      this.getCharacteristicByName(characteristicName)
    ).pipe(
      mergeMap(
        async (characteristic: BluetoothRemoteGATTCharacteristic) => {
          if (this.isConnected() && manageNotifications) {
            await characteristic.startNotifications();
          }

          return characteristic;
        }
      ),
      mergeMap((characteristic: BluetoothRemoteGATTCharacteristic) => {
        return fromEventPattern(
          (addHandler) => {
            characteristic.addEventListener(
              "characteristicvaluechanged",
              addHandler
            );
          },
          async (removeHandler) => {
            if (this.isConnected() && manageNotifications) {
              await characteristic.stopNotifications();
            }

            characteristic.removeEventListener(
              "characteristicvaluechanged",
              removeHandler
            );
          }
        );
      }),
      map((event: any): string => {
        const buffer = event.target.value;
        return decoder.decode(buffer);
      }),
      stitchChunks({ delimiter: BLUETOOTH_CHUNK_DELIMITER }),
      map((payload: any) => {
        try {
          return JSON.parse(payload);
        } catch (_) {
          return payload;
        }
      })
    );

    return this.status$.pipe(
      switchMap((status) =>
        status === STATUS.CONNECTED ? data$ : NEVER
      )
    );
  }

  async readCharacteristic(
    characteristicName: string,
    parse: boolean = false
  ): Promise<any> {
    const characteristic: BluetoothRemoteGATTCharacteristic =
      await this.getCharacteristicByName(characteristicName);

    if (!characteristic) {
      return Promise.reject(
        `Did not find characteristic by the name: ${characteristicName}`
      );
    }

    try {
      const value = await characteristic.readValue();
      const decodedValue = decoder.decode(value);

      if (parse) {
        return JSON.parse(decodedValue);
      }

      return decodedValue;
    } catch (error) {
      return Promise.reject(error.message);
    }
  }

  _addPendingAction(actionId: string): void {
    const actions = this.pendingActions$.getValue();
    this.pendingActions$.next([...actions, actionId]);
  }

  _removePendingAction(actionId: string): void {
    const actions = this.pendingActions$.getValue();
    this.pendingActions$.next(
      actions.filter((id: string): boolean => id !== actionId)
    );
  }

  async _autoToggleActionNotifications() {
    const actionsCharacteristic = await this.getCharacteristicByName(
      "actions"
    );

    let started = false;

    this.pendingActions$.subscribe(async (pendingActions: string[]) => {
      const hasPendingActions = !!pendingActions.length;

      if (this.isConnected() && hasPendingActions && !started) {
        await actionsCharacteristic.startNotifications();
        started = true;
      }

      if (this.isConnected() && !hasPendingActions && started) {
        await actionsCharacteristic.stopNotifications();
        started = false;
      }
    });
  }

  async dispatchAction({
    characteristicName,
    action
  }: ActionOptions): Promise<any> {
    const {
      responseRequired = false,
      responseTimeout = DEFAULT_ACTION_RESPONSE_TIMEOUT
    } = action;

    return new Promise(async (resolve, reject) => {
      const characteristic: BluetoothRemoteGATTCharacteristic | void =
        await this.getCharacteristicByName(characteristicName).catch(
          () => {
            reject(
              `Did not find characteristic by the name: ${characteristicName}`
            );
          }
        );

      if (!characteristic) {
        return;
      }

      const actionId = Date.now().toString(); // use to later identify and filter response
      const payload = encoder.encode(
        JSON.stringify({ actionId, ...action })
      ); // add the response id to the action

      if (responseRequired && responseTimeout) {
        this._addPendingAction(actionId);

        const timeout = timer(responseTimeout).subscribe(() => {
          this._removePendingAction(actionId);
          reject(
            `Action with id ${actionId} timed out after ${responseTimeout}ms`
          );
        });

        // listen for a response before writing
        this.subscribeToCharacteristic({
          characteristicName,
          manageNotifications: false
        })
          .pipe(
            filter((response: any) => response?.actionId === actionId),
            take(1)
          )
          .subscribe((response) => {
            timeout.unsubscribe();
            this._removePendingAction(actionId);
            resolve(response);
          });

        // register action by writing
        characteristic
          .writeValueWithoutResponse(payload)
          .catch((error) => {
            this._removePendingAction(actionId);
            reject(error.message);
          });
      } else {
        characteristic
          .writeValueWithoutResponse(payload)
          .then(() => {
            resolve(null);
          })
          .catch((error) => {
            reject(error.message);
          });
      }
    });
  }
}
