// Taken from react-native-ble-manager project

export declare class BleManager {
  start(options?: StartOptions): Promise<void>;

  scan(
    serviceUUIDs: string[],
    seconds: number,
    allowDuplicates?: boolean,
    options?: ScanOptions
  ): Promise<void>;
  stopScan(): Promise<void>;
  connect(peripheralID: string): Promise<void>;
  disconnect(peripheralID: string, force?: boolean): Promise<void>;
  checkState(): void;
  startNotification(
    peripheralID: string,
    serviceUUID: string,
    characteristicUUID: string
  ): Promise<void>;

  /// Android only
  startNotificationUseBuffer(
    peripheralID: string,
    serviceUUID: string,
    characteristicUUID: string,
    buffer: number
  ): Promise<void>;

  stopNotification(
    peripheralID: string,
    serviceUUID: string,
    characteristicUUID: string
  ): Promise<void>;

  read(
    peripheralID: string,
    serviceUUID: string,
    characteristicUUID: string
  ): Promise<any>;
  write(
    peripheralID: string,
    serviceUUID: string,
    characteristicUUID: string,
    data: any,
    maxByteSize?: number
  ): Promise<void>;
  writeWithoutResponse(
    peripheralID: string,
    serviceUUID: string,
    characteristicUUID: string,
    data: any,
    maxByteSize?: number,
    queueSleepTime?: number
  ): Promise<void>;

  readRSSI(peripheralID: string): Promise<void>;

  getConnectedPeripherals(
    serviceUUIDs: string[]
  ): Promise<Peripheral[]>;
  getDiscoveredPeripherals(): Promise<Peripheral[]>;
  isPeripheralConnected(
    peripheralID: string,
    serviceUUIDs: string[]
  ): Promise<boolean>;

  requestConnectionPriority(
    peripheralID: string,
    connectionPriority: ConnectionPriority
  ): Promise<void>;
  /// Android only
  enableBluetooth(): Promise<void>;
  // [Android only]
  refreshCache(peripheralID: string): Promise<void>;
  // [Android only API 21+]
  requestMTU(peripheralID: string, mtu: number): Promise<void>;

  createBond(
    peripheralID: string,
    peripheralPin?: string
  ): Promise<void>;
  removeBond(peripheralID: string): Promise<void>;
  getBondedPeripherals(): Promise<Peripheral[]>;
  removePeripheral(peripheralID: string): Promise<void>;

  retrieveServices(
    peripheralID: string,
    serviceUUIDs?: string[]
  ): Promise<PeripheralInfo>;
}

export interface Peripheral {
  id: string;
  rssi: number;
  name?: string;
  advertising: AdvertisingData;
}

export interface AdvertisingData {
  isConnectable?: boolean;
  localName?: string;
  manufacturerData?: any;
  serviceUUIDs?: string[];
  txPowerLevel?: number;
}

export interface StartOptions {
  showAlert?: boolean;
  restoreIdentifierKey?: string;
  queueIdentifierKey?: string;
  forceLegacy?: boolean;
}

export interface ScanOptions {
  numberOfMatches?: number;
  matchMode?: number;
  scanMode?: number;
  reportDelay?: number;
}

// [Android only API 21+]
export enum ConnectionPriority {
  balanced = 0,
  high = 1,
  low = 2
}

// Custom
export interface PeripheralInfo {
  characteristics: Characteristic[];
}

// Custom
export interface Characteristic {
  characteristic: string; // characteristic UUID
}
