import { BLUETOOTH_PRIMARY_SERVICE_UUID_HEX } from "@neurosity/ipk";
import { BLUETOOTH_CHUNK_DELIMITER } from "@neurosity/ipk";
import { BLUETOOTH_DEVICE_NAME_PREFIXES } from "@neurosity/ipk";
import { BLUETOOTH_COMPANY_IDENTIFIER_HEX } from "@neurosity/ipk";
import { Observable, BehaviorSubject, ReplaySubject, identity } from "rxjs";
import { defer, merge, timer, fromEventPattern, NEVER } from "rxjs";
import { switchMap, map, filter, tap } from "rxjs/operators";
import { shareReplay, distinctUntilChanged } from "rxjs/operators";
import { take, share } from "rxjs/operators";

import { BluetoothTransport } from "../BluetoothTransport";
import { isWebBluetoothSupported } from "./isWebBluetoothSupported";
import { create6DigitPin } from "../utils/create6DigitPin";
import { TextCodec } from "../utils/textCodec";
import { ActionOptions, SubscribeOptions } from "../types";
import { TRANSPORT_TYPE, BLUETOOTH_CONNECTION } from "../types";
import { DEFAULT_ACTION_RESPONSE_TIMEOUT } from "../constants";
import { CHARACTERISTIC_UUIDS_TO_NAMES } from "../constants";
import { DeviceInfo } from "../../../types/deviceInfo";
import { decodeJSONChunks } from "../utils/decodeJSONChunks";

type Options = {
  autoConnect?: boolean;
};

const defaultOptions: Options = {
  autoConnect: true
};

export class WebBluetoothTransport implements BluetoothTransport {
  type: TRANSPORT_TYPE = TRANSPORT_TYPE.WEB;
  textCodec = new TextCodec(this.type);
  options: Options;
  device: BluetoothDevice;
  server: BluetoothRemoteGATTServer;
  service: BluetoothRemoteGATTService;
  characteristicsByName: {
    [name: string]: BluetoothRemoteGATTCharacteristic;
  } = {};

  connection$ = new BehaviorSubject<BLUETOOTH_CONNECTION>(
    BLUETOOTH_CONNECTION.DISCONNECTED
  );
  pendingActions$ = new BehaviorSubject<any[]>([]);
  logs$ = new ReplaySubject<string>(10);
  onDisconnected$: Observable<void> = this._onDisconnected().pipe(share());
  connectionStream$: Observable<BLUETOOTH_CONNECTION> = this.connection$
    .asObservable()
    .pipe(
      filter((connection) => !!connection),
      distinctUntilChanged(),
      shareReplay(1)
    );

  _isAutoConnectEnabled$ = new ReplaySubject<boolean>(1);

  constructor(options: Options = {}) {
    this.options = { ...defaultOptions, ...options };

    if (!isWebBluetoothSupported()) {
      const errorMessage = "Web Bluetooth is not supported";
      this.addLog(errorMessage);
      throw new Error(errorMessage);
    }

    this._isAutoConnectEnabled$.subscribe((autoConnect) => {
      this.addLog(`Auto connect: ${autoConnect ? "enabled" : "disabled"}`);
    });

    this._isAutoConnectEnabled$.next(this.options.autoConnect);

    this.connection$.asObservable().subscribe((connection) => {
      this.addLog(`connection status is ${connection}`);
    });

    this.onDisconnected$.subscribe(() => {
      this.connection$.next(BLUETOOTH_CONNECTION.DISCONNECTED);
    });
  }

  async _getPairedDevices(): Promise<BluetoothDevice[]> {
    return await navigator.bluetooth.getDevices();
  }

  _autoConnect(selectedDevice$: Observable<DeviceInfo>): Observable<void> {
    return this._isAutoConnectEnabled$.pipe(
      switchMap((isAutoConnectEnabled) =>
        isAutoConnectEnabled
          ? merge(
              selectedDevice$,
              this.onDisconnected$.pipe(switchMap(() => selectedDevice$))
            )
          : NEVER
      ),
      switchMap(async (selectedDevice) => {
        const { deviceNickname } = selectedDevice;

        if (this.isConnected()) {
          this.addLog(
            `Auto connect: ${deviceNickname} is already connected. Skipping auto connect.`
          );
          return;
        }

        const [devicesError, devices] = await this._getPairedDevices()
          .then((devices) => [null, devices])
          .catch((error) => [error, null]);

        if (devicesError) {
          throw new Error(
            `failed to get devices: ${devicesError?.message ?? devicesError}`
          );
        }

        this.addLog(
          `Auto connect: found ${devices.length} devices ${devices
            .map(({ name }) => name)
            .join(", ")}`
        );

        // @important - Using `findLast` instead of `find` because somehow the browser
        // is finding multiple peripherals with the same name
        const device = devices.findLast(
          (device: BluetoothDevice) => device.name === deviceNickname
        );

        if (!device) {
          throw new Error(
            `couldn't find selected device in the list of paired devices.`
          );
        }

        this.addLog(
          `Auto connect: ${deviceNickname} was detected and previously paired`
        );

        return device;
      }),
      tap(() => {
        this.connection$.next(BLUETOOTH_CONNECTION.SCANNING);
      }),
      switchMap((device: BluetoothDevice) => onAdvertisementReceived(device)),
      switchMap(async (advertisement) => {
        this.addLog(`Advertisement received for ${advertisement.device.name}`);
        return await this.getServerServiceAndCharacteristics(
          advertisement.device
        );
      })
    );
  }

  enableAutoConnect(autoConnect: boolean): void {
    this._isAutoConnectEnabled$.next(autoConnect);
  }

  addLog(log: string) {
    this.logs$.next(log);
  }

  isConnected() {
    const connection = this.connection$.getValue();
    return connection === BLUETOOTH_CONNECTION.CONNECTED;
  }

  connection(): Observable<BLUETOOTH_CONNECTION> {
    return this.connectionStream$;
  }

  async connect(deviceNickname?: string): Promise<void> {
    try {
      // requires user gesture
      const device: BluetoothDevice = await this.requestDevice(deviceNickname);

      await this.getServerServiceAndCharacteristics(device);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async requestDevice(deviceNickname?: string): Promise<BluetoothDevice> {
    try {
      this.addLog("Requesting Bluetooth Device...");

      const prefixes = BLUETOOTH_DEVICE_NAME_PREFIXES.map((namePrefix) => ({
        namePrefix
      }));

      // Ability to only show selectedDevice if provided
      const filters = deviceNickname
        ? [
            {
              name: deviceNickname
            }
          ]
        : prefixes;

      const device = await window.navigator.bluetooth.requestDevice({
        filters: [
          ...filters,
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

      return device;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async getServerServiceAndCharacteristics(device: BluetoothDevice) {
    try {
      this.device = device;

      const isConnecting =
        this.connection$.getValue() === BLUETOOTH_CONNECTION.CONNECTING;
      if (!isConnecting) {
        this.connection$.next(BLUETOOTH_CONNECTION.CONNECTING);
      }

      this.server = await device.gatt.connect();

      this.addLog(`Getting service...`);
      this.service = await this.server.getPrimaryService(
        BLUETOOTH_PRIMARY_SERVICE_UUID_HEX
      );
      this.addLog(
        `Got service ${this.service.uuid}, getting characteristics...`
      );

      const characteristicsList = await this.service.getCharacteristics();

      this.addLog(`Got characteristics`);

      this.characteristicsByName = Object.fromEntries(
        characteristicsList.map((characteristic) => [
          CHARACTERISTIC_UUIDS_TO_NAMES[characteristic.uuid],
          characteristic
        ])
      );

      this.connection$.next(BLUETOOTH_CONNECTION.CONNECTED);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  _onDisconnected(): Observable<any> {
    return this.connection$
      .asObservable()
      .pipe(
        switchMap((connection) =>
          connection === BLUETOOTH_CONNECTION.CONNECTED
            ? fromDOMEvent(this.device, "gattserverdisconnected")
            : NEVER
        )
      );
  }

  async disconnect(): Promise<void> {
    const isDeviceConnected = this?.device?.gatt?.connected;
    if (isDeviceConnected) {
      this.device.gatt.disconnect();
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
    manageNotifications = true,
    skipJSONDecoding = false
  }: SubscribeOptions): Observable<any> {
    const data$ = defer(() =>
      this.getCharacteristicByName(characteristicName)
    ).pipe(
      switchMap(async (characteristic: BluetoothRemoteGATTCharacteristic) => {
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
      }),
      switchMap((characteristic: BluetoothRemoteGATTCharacteristic) => {
        return fromDOMEvent(
          characteristic,
          "characteristicvaluechanged",
          async () => {
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
          }
        );
      }),
      map((event): Uint8Array => event.target.value.buffer)
    );

    return this.connection$.pipe(
      switchMap((connection) =>
        connection === BLUETOOTH_CONNECTION.CONNECTED
          ? data$.pipe(
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
    try {
      this.addLog(`Reading characteristic: ${characteristicName}`);

      const characteristic: BluetoothRemoteGATTCharacteristic =
        await this.getCharacteristicByName(characteristicName);

      if (!characteristic) {
        this.addLog(`Did not fund ${characteristicName} characteristic`);

        return Promise.reject(
          `Did not find characteristic by the name: ${characteristicName}`
        );
      }

      const dataview: DataView = await characteristic.readValue();
      const arrayBuffer = dataview.buffer as Uint8Array;
      const decodedValue: string = this.textCodec.decode(arrayBuffer);
      const data = parse ? JSON.parse(decodedValue) : decodedValue;

      this.addLog(
        `Received read data from ${characteristicName} characteristic: \n${data}`
      );

      return data;
    } catch (error) {
      return Promise.reject(`Error reading characteristic: ${error.message}`);
    }
  }

  async writeCharacteristic(
    characteristicName: string,
    data: string
  ): Promise<void> {
    this.addLog(`Writing characteristic: ${characteristicName}`);

    const characteristic: BluetoothRemoteGATTCharacteristic =
      await this.getCharacteristicByName(characteristicName);

    if (!characteristic) {
      this.addLog(`Did not fund ${characteristicName} characteristic`);

      return Promise.reject(
        `Did not find characteristic by the name: ${characteristicName}`
      );
    }

    const encoded = this.textCodec.encode(data);

    await characteristic.writeValueWithResponse(encoded as Uint8Array);
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
    let actionsCharacteristic: BluetoothRemoteGATTCharacteristic;
    let started: boolean = false;

    return this.connection$.asObservable().pipe(
      switchMap((connection) =>
        connection === BLUETOOTH_CONNECTION.CONNECTED
          ? defer(() => this.getCharacteristicByName("actions")).pipe(
              switchMap((characteristic: BluetoothRemoteGATTCharacteristic) => {
                actionsCharacteristic = characteristic;
                return this.pendingActions$;
              })
            )
          : NEVER
      ),
      tap(async (pendingActions: string[]) => {
        const hasPendingActions = !!pendingActions.length;

        if (hasPendingActions && !started) {
          started = true;
          try {
            await actionsCharacteristic.startNotifications();
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
            await actionsCharacteristic.stopNotifications();
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
      const characteristic: BluetoothRemoteGATTCharacteristic | void =
        await this.getCharacteristicByName(characteristicName).catch(() => {
          reject(
            `Did not find characteristic by the name: ${characteristicName}`
          );
        });

      if (!characteristic) {
        return;
      }

      const actionId: number = create6DigitPin(); // use to later identify and filter response
      const payload = JSON.stringify({ actionId, ...action }); // add the response id to the action

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
        this.writeCharacteristic(characteristicName, payload).catch((error) => {
          this._removePendingAction(actionId);
          reject(error.message);
        });
      } else {
        this.writeCharacteristic(characteristicName, payload)
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

function fromDOMEvent(
  target: any,
  eventName: any,
  beforeRemove?: () => Promise<void>
): Observable<any> {
  return fromEventPattern(
    (addHandler) => {
      target.addEventListener(eventName, addHandler);
    },
    async (removeHandler) => {
      if (beforeRemove) {
        await beforeRemove();
      }

      target.removeEventListener(eventName, removeHandler);
    }
  );
}

function onAdvertisementReceived(
  device: BluetoothDevice | any
): Observable<BluetoothAdvertisingEvent> {
  return new Observable((subscriber) => {
    const abortController = new AbortController();
    const { signal } = abortController;

    const listener = device.addEventListener(
      "advertisementreceived",
      (advertisement: BluetoothAdvertisingEvent) => {
        abortController.abort();
        subscriber.next(advertisement);
        subscriber.complete();
      },
      {
        once: true
      }
    );

    try {
      device.watchAdvertisements({ signal });
    } catch (error) {
      subscriber.error(error);
    }

    return () => {
      abortController.abort();
      device.removeEventListener("advertisementreceived", listener);
    };
  });
}
