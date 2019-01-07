import { ISkill } from "./skill.d";

export interface IContext {
  deviceId: string;
  socketUrl: string;
  skill: ISkill;
}
