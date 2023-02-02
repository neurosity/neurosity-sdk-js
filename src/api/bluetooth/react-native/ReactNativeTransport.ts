import { BLUETOOTH_PRIMARY_SERVICE_UUID_STRING } from "@neurosity/ipk";
import { BLUETOOTH_CHUNK_DELIMITER } from "@neurosity/ipk";
import { BLUETOOTH_DEVICE_NAME_PREFIXES } from "@neurosity/ipk";
import { Observable, BehaviorSubject, ReplaySubject, NEVER } from "rxjs";
import { defer, merge, of, timer, fromEventPattern, identity } from "rxjs";
import { switchMap, map, filter, takeUntil, tap } from "rxjs/operators";
import { shareReplay, distinctUntilChanged, finalize } from "rxjs/operators";
import { take, share, scan, distinct } from "rxjs/operators";

import { BluetoothTransport } from "../BluetoothTransport";
import { create6DigitPin } from "../utils/create6DigitPin";
import { TextCodec } from "../utils/textCodec";
import { ActionOptions, SubscribeOptions } from "../types";
import { TRANSPORT_TYPE, BLUETOOTH_CONNECTION } from "../types";
import { BleManager } from "./types/BleManagerTypes";
import { Peripheral, PeripheralInfo } from "./types/BleManagerTypes";
import { NativeEventEmitter } from "./types/ReactNativeTypes";
import { PlatformOSType } from "./types/ReactNativeTypes";
import { DEFAULT_ACTION_RESPONSE_TIMEOUT } from "../constants";
import { CHARACTERISTIC_UUIDS_TO_NAMES } from "../constants";
import { ANDROID_MAX_MTU } from "../constants";
import { REACT_NATIVE_MAX_BYTE_SIZE } from "../constants";
import { DeviceInfo } from "../../../types/deviceInfo";
import { decodeJSONChunks } from "../utils/decodeJSONChunks";

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
  autoConnect?: boolean;
};

type BleManagerEvents = {
  stopScan$: Observable<void>;
  discoverPeripheral$: Observable<Peripheral>;
  connectPeripheral$: Observable<void>;
  disconnectPeripheral$: Observable<void>;
  didUpdateValueForCharacteristic$: Observable<any>;
  didUpdateState$: Observable<any>;
};

const defaultOptions: Pick<Options, "autoConnect"> = {
  autoConnect: true
};

export class ReactNativeTransport implements BluetoothTransport {
  type: TRANSPORT_TYPE = TRANSPORT_TYPE.REACT_NATIVE;
  textCodec = new TextCodec(this.type);
  options: Options;
  BleManager: BleManager;
  bleManagerEmitter: NativeEventEmitter;
  platform: PlatformOSType;
  bleEvents: BleManagerEvents;

  device: Peripheral;
  characteristicsByName: CharacteristicsByName = {};

  connection$ = new BehaviorSubject<BLUETOOTH_CONNECTION>(
    BLUETOOTH_CONNECTION.DISCONNECTED
  );
  pendingActions$ = new BehaviorSubject<any[]>([]);
  logs$ = new ReplaySubject<string>(10);
  onDisconnected$: Observable<void>;
  connectionStream$: Observable<BLUETOOTH_CONNECTION> = this.connection$
    .asObservable()
    .pipe(
      filter((connection) => !!connection),
      distinctUntilChanged(),
      shareReplay(1)
    );

  _isAutoConnectEnabled$ = new ReplaySubject<boolean>(1);

  constructor(options: Options) {
    if (!options) {
      const errorMessage = "React Native transport: missing options.";
      this.addLog(errorMessage);
      throw new Error(errorMessage);
    }

    this.options = { ...defaultOptions, ...options };

    const { BleManager, bleManagerEmitter, platform, autoConnect } =
      this.options;

    if (!BleManager) {
      const errorMessage = "React Native option: BleManager not provided.";
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
      const errorMessage = "React Native option: platform not provided.";
      this.addLog(errorMessage);
      throw new Error(errorMessage);
    }

    this.BleManager = BleManager;
    this.bleManagerEmitter = bleManagerEmitter;
    this.platform = platform;

    this._isAutoConnectEnabled$.next(autoConnect);

    this._isAutoConnectEnabled$.subscribe((autoConnect) => {
      this.addLog(`Auto connect: ${autoConnect ? "enabled" : "disabled"}`);
    });

    // We create a single listener per event type to
    // avoid missing events when multiple listeners are attached.
    this.bleEvents = {
      stopScan$: this._fromEvent("BleManagerStopScan"),
      discoverPeripheral$: this._fromEvent("BleManagerDiscoverPeripheral"),
      connectPeripheral$: this._fromEvent("BleManagerConnectPeripheral"),
      disconnectPeripheral$: this._fromEvent("BleManagerDisconnectPeripheral"),
      didUpdateValueForCharacteristic$: this._fromEvent(
        "BleManagerDidUpdateValueForCharacteristic"
      ),
      didUpdateState$: this._fromEvent("BleManagerDidUpdateState")
    };

    this.onDisconnected$ = this.bleEvents.disconnectPeripheral$.pipe(share());

    // Initializes the module. This can only be called once.
    this.BleManager.start({ showAlert: false })
      .then(() => {
        this.addLog(`BleManger started`);
      })
      .catch((error) => {
        this.addLog(`BleManger failed to start. ${error?.message ?? error}`);
      });

    this.connection$.asObservable().subscribe((connection) => {
      this.addLog(`connection status is ${connection}`);
    });

    this.onDisconnected$.subscribe(() => {
      this.connection$.next(BLUETOOTH_CONNECTION.DISCONNECTED);
    });
  }

  addLog(log: string) {
    this.logs$.next(log);
  }

  isConnected() {
    const connection = this.connection$.getValue();
    return connection === BLUETOOTH_CONNECTION.CONNECTED;
  }

  _autoConnect(selectedDevice$: Observable<DeviceInfo>): Observable<void> {
    const selectedDeviceAfterDisconnect$ = this.onDisconnected$.pipe(
      switchMap(() => selectedDevice$)
    );

    return this._isAutoConnectEnabled$.pipe(
      switchMap((isAutoConnectEnabled) =>
        isAutoConnectEnabled
          ? merge(selectedDevice$, selectedDeviceAfterDisconnect$)
          : NEVER
      ),
      switchMap((selectedDevice) =>
        this.scan().pipe(
          switchMap((peripherals: Peripheral[]) => {
            const peripheralMatch = peripherals.find(
              (peripheral) => peripheral.name === selectedDevice?.deviceNickname
            );

            return peripheralMatch ? of(peripheralMatch) : NEVER;
          }),
          distinct((peripheral: Peripheral) => peripheral.id),
          take(1)
        )
      ),
      switchMap(async (peripheral) => {
        return await this.connect(peripheral);
      })
    );
  }

  enableAutoConnect(autoConnect: boolean): void {
    this._isAutoConnectEnabled$.next(autoConnect);
  }

  connection(): Observable<BLUETOOTH_CONNECTION> {
    return this.connectionStream$;
  }

  _fromEvent(eventName: string): Observable<any> {
    return fromEventPattern(
      (addHandler) => {
        this.bleManagerEmitter.addListener(eventName, addHandler);
      },
      () => {
        this.bleManagerEmitter.removeAllListeners(eventName);
      }
    ).pipe(
      // @important: we need to share the subscription
      // to avoid missing events
      share()
    );
  }

  scan(options?: {
    seconds?: number;
    once?: boolean;
    skipConnectionUpdate?: boolean;
  }): Observable<Peripheral[]> {
    const RESCAN_INTERVAL = 10_000; // 10 seconds
    const seconds = options?.seconds ?? RESCAN_INTERVAL / 1000;
    const once = options?.once ?? false;
    // If we are already connected to a peripheral and start scanning,
    // be default, it will set the connection status to SCANNING and not
    // update it back if no device is connected to
    const skipConnectionUpdate = options?.skipConnectionUpdate ?? false;
    const serviceUUIDs = [BLUETOOTH_PRIMARY_SERVICE_UUID_STRING];
    const allowDuplicates = true;
    const scanOptions = {};

    const scanOnce$ = new Observable((subscriber) => {
      try {
        this.BleManager.scan(
          serviceUUIDs,
          seconds,
          allowDuplicates,
          scanOptions
        ).then(() => {
          this.addLog(`BleManger scanning ${once ? "once" : "indefintely"}`);
          subscriber.next();
        });
      } catch (error) {
        this.addLog(
          `BleManger scanning ${once ? "once" : "indefintely"} failed. ${
            error?.message ?? error
          }`
        );
        subscriber.error(error);
      }

      return () => {
        this.BleManager.stopScan();
      };
    });

    const scan$ = once
      ? scanOnce$
      : timer(0, RESCAN_INTERVAL).pipe(switchMap(() => scanOnce$));

    const peripherals$ = scan$.pipe(
      tap(() => {
        if (!skipConnectionUpdate) {
          this.connection$.next(BLUETOOTH_CONNECTION.SCANNING);
        }
      }),
      takeUntil(this.onDisconnected$),
      switchMap(() => this.bleEvents.discoverPeripheral$),
      // Filter out devices that are not Neurosity devices
      filter((peripheral: Peripheral) => {
        const peripheralName: string =
          peripheral?.advertising?.localName ?? peripheral.name ?? "";

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
        // normalized peripheral name for backwards compatibility
        // Neurosity OS v15 doesn't have peripheral.name as deviceNickname
        // it only has peripheral.advertising.localName as deviceNickname
        // and OS v16 has both as deviceNickname
        const peripheralName: string =
          peripheral?.advertising?.localName ?? peripheral.name ?? "";

        const manufactureDataString = this.textCodec
          .decode(peripheral?.advertising?.manufacturerData?.bytes ?? [])
          ?.slice?.(2); // First 2 bytes are reserved for the Neurosity company code

        return {
          ...acc,
          [peripheral.id]: {
            ...peripheral,
            name: peripheralName,
            manufactureDataString
          }
        };
      }, {}),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      map((peripheralMap): Peripheral[] => Object.values(peripheralMap)),
      share()
    );

    return peripherals$;
  }

  async connect(peripheral: Peripheral): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!peripheral) {
          this.addLog("Peripheral not found");
          return;
        }

        this.connection$.next(BLUETOOTH_CONNECTION.CONNECTING);

        await this.BleManager.connect(peripheral.id);

        this.addLog(`Getting service...`);

        const peripheralInfo: PeripheralInfo =
          await this.BleManager.retrieveServices(peripheral.id, [
            BLUETOOTH_PRIMARY_SERVICE_UUID_STRING
          ]);

        if (!peripheralInfo) {
          this.addLog("Could not retreive services");
          reject(new Error(`Could not retreive services`));
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

        this.addLog(`Got characteristics.`);

        if (this.platform === "android") {
          await this.BleManager.requestMTU(peripheral.id, ANDROID_MAX_MTU)
            .then((updatedMTU) => {
              this.addLog(
                `Successfully updated Android MTU to ${updatedMTU} bytes. Requested MTU: ${ANDROID_MAX_MTU} bytes.`
              );
            })
            .catch((error) => {
              this.addLog(
                `Failed to set Android MTU of ${ANDROID_MAX_MTU} bytes. Error: ${error}`
              );
            });
        }

        this.addLog(`Successfully connected to peripheral ${peripheral.id}`);

        this.connection$.next(BLUETOOTH_CONNECTION.CONNECTED);

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  async disconnect(): Promise<void> {
    try {
      if (this.isConnected() && this?.device?.id) {
        await this.BleManager.disconnect(this.device.id);
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
    manageNotifications = true,
    skipJSONDecoding = false
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
        switchMap(() => this.bleEvents.didUpdateValueForCharacteristic$),
        finalize(async () => {
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
        }),
        filter(({ characteristic }) => characteristic === characteristicUUID),
        map(
          ({
            value
          }: {
            value: number[];
            characteristic: string;
          }): Uint8Array => new Uint8Array(value)
        )
      );

    return this.connection$.pipe(
      switchMap((connection) =>
        connection === BLUETOOTH_CONNECTION.CONNECTED
          ? getData(this.getCharacteristicByName(characteristicName)).pipe(
              skipJSONDecoding
                ? identity // noop
                : decodeJSONChunks({
                    textCodec: this.textCodec,
                    characteristicName,
                    delimiter: BLUETOOTH_CHUNK_DELIMITER,
                    addLog: (message: string) => this.addLog(message)
                  })
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
        new Error(`Did not find characteristic matching ${characteristicName}`)
      );
    }

    try {
      const value: number[] = await this.BleManager.read(
        peripheralId,
        serviceUUID,
        characteristicUUID
      );

      const decodedValue = this.textCodec.decode(new Uint8Array(value));
      const data = parse ? JSON.parse(decodedValue) : decodedValue;

      this.addLog(
        `Received read data from ${characteristicName} characteristic: \n${data}`
      );

      return data;
    } catch (error) {
      return Promise.reject(
        new Error(
          `readCharacteristic ${characteristicName} error. ${
            error?.message ?? error
          }`
        )
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
        new Error(`Did not find characteristic matching ${characteristicName}`)
      );
    }

    const encoded = this.textCodec.encode(data);

    await this.BleManager.write(
      peripheralId,
      serviceUUID,
      characteristicUUID,
      encoded,
      REACT_NATIVE_MAX_BYTE_SIZE
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

  _autoToggleActionNotifications(): Observable<any> {
    let started: boolean = false;

    return this.connection$.asObservable().pipe(
      switchMap((connection) =>
        connection === BLUETOOTH_CONNECTION.CONNECTED
          ? this.pendingActions$
          : NEVER
      ),
      tap(async (pendingActions: string[]) => {
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
            this.addLog(`Started notifications for [actions] characteristic`);
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
            this.addLog(`Stopped notifications for actions characteristic`);
          } catch (error) {
            this.addLog(
              `Attemped to stop notifications for [actions] characteristic: ${
                error?.message ?? error
              }`
            );
          }
        }
      })
    );
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
      const actionId: number = create6DigitPin(); // use to later identify and filter response
      const payload = JSON.stringify({ actionId, ...action }); // add the response id to the action

      this.addLog(`Dispatched action with id ${actionId}`);

      if (responseRequired && responseTimeout) {
        this._addPendingAction(actionId);

        const timeout = timer(responseTimeout).subscribe(() => {
          this._removePendingAction(actionId);
          reject(
            new Error(
              `Action with id ${actionId} timed out after ${responseTimeout}ms`
            )
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
        this.writeCharacteristic(characteristicName, payload).catch((error) => {
          this._removePendingAction(actionId);
          reject(error);
        });
      } else {
        this.writeCharacteristic(characteristicName, payload)
          .then(() => {
            resolve(null);
          })
          .catch((error) => {
            reject(error);
          });
      }
    });
  }
}
