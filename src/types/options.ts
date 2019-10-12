import { ISkill } from "./skill";

export default interface IOptions {
  deviceId: string;
  skill?: ISkill;
  onDeviceSocketUrl?: string;
  timesync?: boolean;
}
