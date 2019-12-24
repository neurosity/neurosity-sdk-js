import { Skill } from "./skill";

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
