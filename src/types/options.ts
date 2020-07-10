import { Skill } from "./skill";
import { SubscriptionManager } from "../subscriptions/SubscriptionManager";

export interface NotionOptions {
  deviceId?: string;
  autoSelectDevice?: boolean;
  timesync?: boolean;
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
