import IActions from "./actions";
import IMetrics from "./metrics";
import { ISkillsClient } from "./skill";

export default interface IClient {
  actions: IActions;
  disconnect(): Promise<any>;
  getInfo(): Promise<any>;
  onStatus(callback: Function): Function;
  offStatus(listener: Function): void;
  metrics: IMetrics;
  skills: ISkillsClient;
  timestamp: number;
}
