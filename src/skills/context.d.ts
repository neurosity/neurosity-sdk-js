import { ISkill } from "./skill.d";

export interface IInternalContext {
  deviceId: string;
  socketUrl: string;
  skill: ISkill;
}

export interface IExternalContext {
  skill: ISkill;
}
