import { ISkill } from "./skills/skill.d";

export default interface IOptions {
  deviceId: string;
  apiKey?: string;
  skill?: ISkill;
  onDeviceSocketUrl?: string;
  timesync?: string;
}
