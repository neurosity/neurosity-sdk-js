import { Skill } from "./skill";
import { SubscriptionManager } from "../subscriptions/SubscriptionManager";
import { BluetoothTransport } from "../api/bluetooth/BluetoothClient";
import { STREAMING_MODE } from "./streaming";

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
  /**
   * @hidden
   */
  skill?: Skill;
}

/**
 * @hidden
 */
export interface SDKDependencies {
  subscriptionManager: SubscriptionManager;
}
