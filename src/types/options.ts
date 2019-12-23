import { Skill } from "./skill";

export interface NotionOptions {
  deviceId: string;
  timesync?: boolean;
  // @hidden
  skill?: Skill;
  // @hidden
  onDeviceSocketUrl?: string;
}
