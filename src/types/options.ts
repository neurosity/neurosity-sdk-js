import { Skill } from "./skill";

/**
 * @internal
 */
export interface NotionOptions {
  deviceId: string;
  timesync?: boolean;
  /**
   * @internal
   */
  skill?: Skill;
  /**
   * @internal
   */
  onDeviceSocketUrl?: string;
}
