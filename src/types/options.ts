import { ISkill } from "./skill";

export default interface IOptions {
  deviceId: string;
  email?: string;
  password?: string;
  accessToken?: string;
  skill?: ISkill;
  onDeviceSocketUrl?: string;
  timesync?: string;
}
