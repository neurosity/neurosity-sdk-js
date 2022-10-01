import { BLUETOOTH_PRIMARY_SERVICE_UUID_STRING } from "@neurosity/ipk";
import { BLUETOOTH_CHUNK_DELIMITER } from "@neurosity/ipk";
import { BLUETOOTH_DEVICE_NAME_PREFIXES } from "@neurosity/ipk";
import { BehaviorSubject, defer, Subject, timer } from "rxjs";
import { fromEventPattern, Observable, of, race, NEVER } from "rxjs";
import { switchMap, map, filter, takeUntil } from "rxjs/operators";
import { shareReplay, distinctUntilChanged } from "rxjs/operators";
import { take, share, scan } from "rxjs/operators";

import { create6DigitPin } from "../utils/create6DigitPin";
import { stitchChunks } from "../utils/stitch";
import { encode, decode } from "../utils/encoding";
import { ActionOptions, SubscribeOptions, STATUS } from "../types";
import { BleManager } from "./types/BleManagerTypes";
import { Peripheral, PeripheralInfo } from "./types/BleManagerTypes";
import { NativeEventEmitter } from "./types/ReactNativeTypes";
import { PlatformOSType } from "./types/ReactNativeTypes";
import { DEFAULT_ACTION_RESPONSE_TIMEOUT } from "../constants";
import { CHARACTERISTIC_UUIDS_TO_NAMES } from "../constants";
import { ANDROD_MAX_MTU } from "../constants";
import { TRANSPORT_TYPE } from "../transportTypes";

type Characteristic = {
  characteristicUUID: string;
  serviceUUID: string;
  peripheralId: string;
};

type CharacteristicsByName = {
  [name: string]: Characteristic;
};

type Options = {
  BleManager: BleManager;
  bleManagerEmitter: NativeEventEmitter;
  platform: PlatformOSType;
};

export class ReactNativeTransport {
  type: TRANSPORT_TYPE = TRANSPORT_TYPE.REACT_NATIVE;
  BleManager: BleManager;
  bleManagerEmitter: NativeEventEmitter;
  platform: PlatformOSType;

  device: Peripheral;
  characteristicsByName: CharacteristicsByName = {};

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

  constructor(options: Options) {
    const { BleManager, bleManagerEmitter, platform } = options;

    if (!BleManager) {
      const errorMessage =
        "React Native option: BleManager not provided.";
      this.addLog(errorMessage);
      throw new Error(errorMessage);
    }

    if (!bleManagerEmitter) {
      const errorMessage =
        "React Native option: bleManagerEmitter not provided.";
      this.addLog(errorMessage);
      throw new Error(errorMessage);
    }

    if (!platform) {
      const errorMessage =
        "React Native option: platform not provided.";
      this.addLog(errorMessage);
      throw new Error(errorMessage);
    }

    this.BleManager = BleManager;
    this.bleManagerEmitter = bleManagerEmitter;
    this.platform = platform;

    // Initializes the module. This can only be called once.
    this.BleManager.start({ showAlert: false })
      .then(() => {
        this.addLog(`BleManger started`);
      })
      .catch((error) => {
        this.addLog(
          `BleManger failed to start. ${error?.message ?? error}`
        );
      });

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

  _fromEvent(eventName: string, onRemove = () => {}): Observable<any> {
    return fromEventPattern(
      (addHandler) => {
        this.bleManagerEmitter.addListener(eventName, addHandler);
      },
      () => {
        this.bleManagerEmitter.removeAllListeners(eventName);
        onRemove();
      }
    );
  }

  onDiscover(options?: { seconds?: number }): Observable<Peripheral[]> {
    const { seconds } = options ?? { seconds: 5 };
    const serviceUUIDs = [BLUETOOTH_PRIMARY_SERVICE_UUID_STRING];
    const allowDuplicates = true;
    const scanOptions = {};

    const onScan$ = new Observable((subscriber) => {
      try {
        this.BleManager.scan(
          serviceUUIDs,
          seconds,
          allowDuplicates,
          scanOptions
        ).then(() => {
          this.addLog(`BleManger scan started`);
          subscriber.next();
        });
      } catch (error) {
        this.addLog(
          `BleManger scan failed. ${error?.message ?? error}`
        );
        subscriber.error(error);
      }

      return () => {
        this.BleManager.stopScan();
      };
    });

    const onStop$ = race(
      this._fromEvent("BleManagerStopScan"),
      this.onDisconnected$
    );

    return onScan$.pipe(
      switchMap(() =>
        this._fromEvent("BleManagerDiscoverPeripheral").pipe(
          takeUntil(onStop$)
        )
      ),
      // Filter out devices that are not Neurosity devices
      filter((peripheral: Peripheral) => {
        const peripheralName =
          peripheral.name ?? peripheral.advertising?.localName ?? "";

        if (!peripheralName) {
          return false;
        }

        const startsWithPrefix =
          BLUETOOTH_DEVICE_NAME_PREFIXES.findIndex((prefix) =>
            peripheralName.startsWith(prefix)
          ) !== -1;

        return startsWithPrefix;
      }),
      scan((acc, peripheral): { [name: string]: Peripheral } => {
        return {
          ...acc,
          [peripheral.id]: peripheral
        };
      }, {}),
      distinctUntilChanged(
        (a, b) => JSON.stringify(a) === JSON.stringify(b)
      ),
      map((peripheralMap): Peripheral[] => Object.values(peripheralMap))
    );
  }

  async connect(peripheral: Peripheral): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!peripheral) {
          this.addLog("Peripheral not found");
          return;
        }

        this.status$.next(STATUS.CONNECTING);

        await this.BleManager.connect(peripheral.id);

        this.addLog(`Getting service...`);

        const peripheralInfo: PeripheralInfo =
          await this.BleManager.retrieveServices(peripheral.id, [
            BLUETOOTH_PRIMARY_SERVICE_UUID_STRING
          ]);

        if (!peripheralInfo) {
          this.addLog("Could not retreive services");
          reject(`Could not retreive services`);
          return;
        }

        this.addLog(
          `Got service ${BLUETOOTH_PRIMARY_SERVICE_UUID_STRING}, getting characteristics...`
        );

        this.device = peripheral;

        this.characteristicsByName = Object.fromEntries(
          peripheralInfo.characteristics.map((characteristic: any) => [
            CHARACTERISTIC_UUIDS_TO_NAMES[
              characteristic.characteristic.toLowerCase() // react native uses uppercase
            ],
            {
              characteristicUUID: characteristic.characteristic,
              serviceUUID: characteristic.service,
              peripheralId: peripheral.id
            }
          ])
        );

        this.addLog(
          `Got characteristics. ${JSON.stringify(
            this.characteristicsByName,
            null,
            2
          )}`
        );

        if (this.platform === "android") {
          this.addLog(`Setting Android MTU to ${ANDROD_MAX_MTU}`);
          await this.BleManager.requestMTU(
            peripheral.id,
            ANDROD_MAX_MTU
          );
        }

        this.addLog(
          `Successfully connected to peripheral ${peripheral.id}`
        );

        this.status$.next(STATUS.CONNECTED);

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  _onDisconnected(): Observable<any> {
    return this.status$
      .asObservable()
      .pipe(
        switchMap((status) =>
          status === STATUS.CONNECTED
            ? this._fromEvent("BleManagerDisconnectPeripheral")
            : NEVER
        )
      );
  }

  async disconnect(): Promise<void> {
    try {
      if (this.isConnected() && this.device) {
        this.autoReconnectEnabled$.next(false);
        await this.BleManager.disconnect(this.device.id);
        this.autoReconnectEnabled$.next(true);
      }
    } catch (error) {
      return Promise.reject(error);
    }
  }

  getCharacteristicByName(characteristicName: string): Characteristic {
    if (!(characteristicName in this.characteristicsByName)) {
      throw new Error(
        `Characteristic by name ${characteristicName} is not found`
      );
    }

    return this.characteristicsByName?.[characteristicName];
  }

  subscribeToCharacteristic({
    characteristicName,
    manageNotifications = true
  }: SubscribeOptions): Observable<any> {
    const getData = ({
      peripheralId,
      serviceUUID,
      characteristicUUID
    }: Characteristic) =>
      defer(async () => {
        if (manageNotifications) {
          try {
            await this.BleManager.startNotification(
              peripheralId,
              serviceUUID,
              characteristicUUID
            );

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
      }).pipe(
        switchMap(() => {
          return this._fromEvent(
            "BleManagerDidUpdateValueForCharacteristic",
            async () => {
              if (manageNotifications) {
                try {
                  await this.BleManager.stopNotification(
                    peripheralId,
                    serviceUUID,
                    characteristicUUID
                  );
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
            }
          );
        }),
        map(({ value }: any): string => {
          console.log(
            "subscribeToCharacteristic typeof value",
            typeof value
          );
          return decode(this.type, value);
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
        status === STATUS.CONNECTED
          ? of(this.getCharacteristicByName(characteristicName)).pipe(
              switchMap((characteristic: Characteristic) =>
                getData(characteristic)
              )
            )
          : NEVER
      )
    );
  }

  async readCharacteristic(
    characteristicName: string,
    parse: boolean = false
  ): Promise<any> {
    this.addLog(`Reading characteristic: ${characteristicName}`);

    const { peripheralId, serviceUUID, characteristicUUID } =
      this.getCharacteristicByName(characteristicName);

    if (!characteristicUUID) {
      return Promise.reject(
        `Did not find characteristic matching ${characteristicName}`
      );
    }

    try {
      const value = await this.BleManager.read(
        peripheralId,
        serviceUUID,
        characteristicUUID
      );

      const decodedValue = decode(this.type, value);
      const data = parse ? JSON.parse(decodedValue) : decodedValue;

      this.addLog(
        `Received read data for ${characteristicName} characteristic: \n${data}`
      );

      return data;
    } catch (error) {
      return Promise.reject(
        `readCharacteristic ${characteristicName} error. ${
          error?.message ?? error
        }`
      );
    }
  }

  async writeCharacteristic(
    characteristicName: string,
    data: string
  ): Promise<void> {
    this.addLog(`Writing characteristic: ${characteristicName}`);

    const { peripheralId, serviceUUID, characteristicUUID } =
      this.getCharacteristicByName(characteristicName);

    if (!characteristicUUID) {
      return Promise.reject(
        `Did not find characteristic matching ${characteristicName}`
      );
    }

    const encoded = encode(this.type, data);

    await this.BleManager.writeWithoutResponse(
      peripheralId,
      serviceUUID,
      characteristicUUID,
      encoded
    );
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
    let started: boolean = false;

    this.status$
      .asObservable()
      .pipe(
        switchMap((status) =>
          status === STATUS.CONNECTED ? this.pendingActions$ : NEVER
        )
      )
      .subscribe(async (pendingActions: string[]) => {
        const { peripheralId, serviceUUID, characteristicUUID } =
          this.getCharacteristicByName("actions");

        const hasPendingActions = !!pendingActions.length;

        if (hasPendingActions && !started) {
          started = true;
          try {
            await this.BleManager.startNotification(
              peripheralId,
              serviceUUID,
              characteristicUUID
            );
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
            await this.BleManager.stopNotification(
              peripheralId,
              serviceUUID,
              characteristicUUID
            );
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
    const { peripheralId, serviceUUID, characteristicUUID } =
      this.getCharacteristicByName(characteristicName);

    const {
      responseRequired = false,
      responseTimeout = DEFAULT_ACTION_RESPONSE_TIMEOUT
    } = action;

    return new Promise(async (resolve, reject) => {
      if (!characteristicUUID) {
        reject(
          `Did not find characteristic by the name: ${characteristicName}`
        );
        return;
      }

      const actionId: number = create6DigitPin(); // use to later identify and filter response
      const payload = encode(
        this.type,
        JSON.stringify({ actionId, ...action }) // add the response id to the action
      );

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
        this.BleManager.writeWithoutResponse(
          peripheralId,
          serviceUUID,
          characteristicUUID,
          payload
        ).catch((error) => {
          this._removePendingAction(actionId);
          reject(error.message);
        });
      } else {
        this.BleManager.writeWithoutResponse(
          peripheralId,
          serviceUUID,
          characteristicUUID,
          payload
        )
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
