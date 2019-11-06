import { User } from "@firebase/auth-types";
import IActions from "./actions";
import IMetrics from "./metrics";
import { ISkillsClient } from "./skill";
import { Credentials } from "./credentials";
import { ChangeSettings } from "./settings";

export default interface IClient {
  user: User | null;
  actions: IActions;
  disconnect(): Promise<any>;
  getInfo(): Promise<any>;
  login?(credentails: Credentials): Promise<any>;
  onNamespace(namespace: string, callback: Function): Function;
  offNamespace(namespace: string, listener: Function): void;
  metrics: IMetrics;
  skills: ISkillsClient;
  timestamp: number;
  changeSettings(settings: ChangeSettings): Promise<void>;
}
