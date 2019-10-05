import { ISkill } from "./skill";

export default interface IOptions {
  deviceId: string;
  apiKey?: string;
  skill?: ISkill;
  onDeviceSocketUrl?: string;
  timesync?: string;
}
