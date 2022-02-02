import { Skill } from "./skill";
import { SubscriptionManager } from "../subscriptions/SubscriptionManager";

export interface NotionOptions {
  deviceId?: string;
  autoSelectDevice?: boolean;
  timesync?: boolean;
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
  /**
   * @hidden
   */
  onDeviceSocketUrl?: string;
}

/**
 * @hidden
 */
export interface NotionDependencies {
  subscriptionManager: SubscriptionManager;
}
