import IActions from "./actions.d";
import IMetrics from "./metrics.d";
import { ISkillsClient } from "../skills/skill.d";

export default interface IClient {
  actions: IActions;
  disconnect(): Promise<any>;
  getInfo(): Promise<any>;
  onStatus(callback?: Function): void;
  metrics: IMetrics;
  skills: ISkillsClient;
  timestamp: number;
}
