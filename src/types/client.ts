import IActions from "./actions";
import IMetrics from "./metrics";
import { ISkillsClient } from "./skill";
import { Credentials } from "./credentials";

export default interface IClient {
  actions: IActions;
  disconnect(): Promise<any>;
  getInfo(): Promise<any>;
  login?(credentails: Credentials): Promise<any>;
  onStatus(callback: Function): Function;
  offStatus(listener: Function): void;
  metrics: IMetrics;
  skills: ISkillsClient;
  timestamp: number;
}
