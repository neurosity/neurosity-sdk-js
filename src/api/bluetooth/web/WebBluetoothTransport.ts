import { BLUETOOTH_CHARACTERISTICS } from "@neurosity/ipk";
import { BLUETOOTH_PRIMARY_SERVICE_UUID_HEX } from "@neurosity/ipk";
import { BLUETOOTH_CHUNK_DELIMITER } from "@neurosity/ipk";
import { BLUETOOTH_DEVICE_NAME_PREFIXES } from "@neurosity/ipk";
import { BLUETOOTH_COMPANY_IDENTIFIER_HEX } from "@neurosity/ipk";
import { BehaviorSubject, defer, Subject, timer } from "rxjs";
import { fromEventPattern, Observable, NEVER } from "rxjs";
import { switchMap, map, filter } from "rxjs/operators";
import { shareReplay, distinctUntilChanged } from "rxjs/operators";
import { take, share } from "rxjs/operators";

import { isWebBluetoothSupported } from "./isWebBluetoothSupported";
import { create6DigitPin } from "../utils/create6DigitPin";
import { stitchChunks } from "../utils/stitch";

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

export class WebBluetoothTransport {
  device: BluetoothDevice;
  server: BluetoothRemoteGATTServer;
  service: BluetoothRemoteGATTService;
  characteristicsByName: {
    [name: string]: BluetoothRemoteGATTCharacteristic;
  } = {};

  status$ = new BehaviorSubject<STATUS>(STATUS.DISCONNECTED);
  autoReconnectEnabled$ = new BehaviorSubject<boolean>(true);
  pendingActions$ = new BehaviorSubject<any[]>([]);
  logs$ = new Subject<string>();
  onDisconnected$: Observable<void> = this._onDisconnected().pipe(
    share()
  );
  connectionStatus$: Observable<STATUS> = this.status$
    .asObservable()
    .pipe(
      filter((status) => !!status),
      distinctUntilChanged(),
      shareReplay(1)
    );

  constructor() {
    if (!isWebBluetoothSupported()) {
      const errorMessage = "Web Bluetooth is not supported";
      this.addLog(errorMessage);
      throw new Error(errorMessage);
    }

    this.status$.asObservable().subscribe((status) => {
      this.addLog(`status is ${status}`);
    });

    this.onDisconnected$.subscribe(() => {
      this.status$.next(STATUS.DISCONNECTED);
    });

    this.onDisconnected$.subscribe(() => {
      // only auto-reconnect if disconnected action not started by the user
      if (this.autoReconnectEnabled$.getValue()) {
        // this.addLog(`Attempting to reconnect...`);
        //this.getServerServiceAndCharacteristics();
      }
    });

    this._autoToggleActionNotifications();
  }

  addLog(log: string) {
    this.logs$.next(log);
  }

  isConnected() {
    const status = this.status$.getValue();
    return status === STATUS.CONNECTED;
  }

  connectionStatus(): Observable<STATUS> {
    return this.connectionStatus$;
  }

  async connect(): Promise<void> {
    try {
      // requires user gesture
      this.device = await this.requestDevice();

      await this.getServerServiceAndCharacteristics();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async requestDevice() {
    try {
      this.addLog("Requesting Bluetooth Device...");

      this.device = await window.navigator.bluetooth.requestDevice({
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

      return this.device;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async getServerServiceAndCharacteristics() {
    try {
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
    } catch (error) {
      return Promise.reject(error);
    }
  }

  _onDisconnected(): Observable<any> {
    return this.status$.asObservable().pipe(
      switchMap((status) =>
        status === STATUS.CONNECTED
          ? fromEventPattern(
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
            )
          : NEVER
      )
    );
  }

  disconnect(): void {
    const isDeviceConnected = this?.device?.gatt?.connected;
    if (isDeviceConnected) {
      this.autoReconnectEnabled$.next(false);
      this.device.gatt.disconnect();
      this.autoReconnectEnabled$.next(true);
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
    const data$ = defer(() =>
      this.getCharacteristicByName(characteristicName)
    ).pipe(
      switchMap(
        async (characteristic: BluetoothRemoteGATTCharacteristic) => {
          if (this.isConnected() && manageNotifications) {
            try {
              await characteristic.startNotifications();
              this.addLog(
                `Started notifications for ${characteristicName} characteristic`
              );
            } catch (error) {
              this.addLog(
                `Attemped to stop notifications for ${characteristicName} characteristic: ${
                  error?.message ?? error
                }`
              );
            }
          }

          return characteristic;
        }
      ),
      switchMap((characteristic: BluetoothRemoteGATTCharacteristic) => {
        return fromEventPattern(
          (addHandler) => {
            characteristic.addEventListener(
              "characteristicvaluechanged",
              addHandler
            );
          },
          async (removeHandler) => {
            if (this.isConnected() && manageNotifications) {
              try {
                await characteristic.stopNotifications();
                this.addLog(
                  `Stopped notifications for ${characteristicName} characteristic`
                );
              } catch (error) {
                this.addLog(
                  `Attemped to stop notifications for ${characteristicName} characteristic: ${
                    error?.message ?? error
                  }`
                );
              }
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
      // when streaming at ultra-low latency, the logs will slow down rendering
      // tap((data) => {
      //   this.addLog(
      //     `Received data for ${characteristicName} characteristic: \n${JSON.stringify(
      //       data,
      //       null,
      //       2
      //     )}`
      //   );
      // })
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
    this.addLog(`Reading characteristic: ${characteristicName}`);

    const characteristic: BluetoothRemoteGATTCharacteristic =
      await this.getCharacteristicByName(characteristicName);

    if (!characteristic) {
      this.addLog(`Did not fund ${characteristicName} characteristic`);

      return Promise.reject(
        `Did not find characteristic by the name: ${characteristicName}`
      );
    }

    try {
      const value = await characteristic.readValue();
      const decodedValue = decoder.decode(value);
      const data = parse ? JSON.parse(decodedValue) : decodedValue;

      this.addLog(
        `Received read data for ${characteristicName} characteristic: \n${data}`
      );

      return data;
    } catch (error) {
      return Promise.reject(error.message);
    }
  }

  _addPendingAction(actionId: number): void {
    const actions = this.pendingActions$.getValue();
    this.pendingActions$.next([...actions, actionId]);
  }

  _removePendingAction(actionId: number): void {
    const actions = this.pendingActions$.getValue();
    this.pendingActions$.next(
      actions.filter((id: number): boolean => id !== actionId)
    );
  }

  async _autoToggleActionNotifications() {
    let actionsCharacteristic: BluetoothRemoteGATTCharacteristic;
    let started: boolean = false;

    this.status$
      .asObservable()
      .pipe(
        switchMap((status) =>
          status === STATUS.CONNECTED
            ? defer(() => this.getCharacteristicByName("actions")).pipe(
                switchMap((characteristic) => {
                  actionsCharacteristic = characteristic;
                  return this.pendingActions$;
                })
              )
            : NEVER
        )
      )
      .subscribe(async (pendingActions: string[]) => {
        const hasPendingActions = !!pendingActions.length;

        if (hasPendingActions && !started) {
          started = true;
          try {
            await actionsCharacteristic.startNotifications();
            this.addLog(
              `Started notifications for [actions] characteristic`
            );
          } catch (error) {
            this.addLog(
              `Attemped to start notifications for [actions] characteristic: ${
                error?.message ?? error
              }`
            );
          }
        }

        if (!hasPendingActions && started) {
          started = false;
          try {
            await actionsCharacteristic.stopNotifications();
            this.addLog(
              `Stopped notifications for actions characteristic`
            );
          } catch (error) {
            this.addLog(
              `Attemped to stop notifications for [actions] characteristic: ${
                error?.message ?? error
              }`
            );
          }
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

      const actionId: number = create6DigitPin(); // use to later identify and filter response
      const payload = encoder.encode(
        JSON.stringify({ actionId, ...action })
      ); // add the response id to the action

      this.addLog(`Dispatched action with id ${actionId}`);

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
