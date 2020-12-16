import { Skill } from "./skill";
import { SubscriptionManager } from "../subscriptions/SubscriptionManager";

export enum StreamingModes {
  ONLINE = "online",
  OFFLINE = "offline"
}

/**
 * @hidden
 */
export type StreamingMode =
  | StreamingModes.ONLINE
  | StreamingModes.OFFLINE;

export interface NotionOptions {
  deviceId?: string;
  mode?: StreamingMode;
  autoSelectDevice?: boolean;
  timesync?: boolean;
  /**
   * @hidden
   */
  databaseURL?: string; // @TODO: remove after offline url is predictable
  /**
   * @hidden
   */
  authURL?: string; // @TODO: remove after offline url is predictable
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
