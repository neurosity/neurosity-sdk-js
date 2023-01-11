import { SubscriptionManager } from "../subscriptions/SubscriptionManager.js";
import { BluetoothTransport } from "../api/bluetooth/BluetoothClient.js";
import { STREAMING_MODE } from "./streaming.js";

export interface SDKOptions {
  deviceId?: string;
  autoSelectDevice?: boolean;
  timesync?: boolean;
  bluetoothTransport?: BluetoothTransport;
  streamingMode?: STREAMING_MODE;
  /**
   * @hidden
   */
  emulator?: boolean;
  /**
   * @hidden
   */
  emulatorHost?: string;
  /**
   * @hidden
   */
  emulatorAuthPort?: number;
  /**
   * @hidden
   */
  emulatorDatabasePort?: number;
  /**
   * @hidden
   */
  emulatorOptions?: {
    mockUserToken?: any;
  };
  /**
   * @hidden
   */
  emulatorFunctionsPort?: number;
  /**
   * @hidden
   */
  emulatorFirestorePort?: number;
}

/**
 * @hidden
 */
export interface SDKDependencies {
  subscriptionManager: SubscriptionManager;
}
