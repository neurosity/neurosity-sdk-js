import { Observable } from "rxjs";
import { User } from "@firebase/auth-types";
import { Actions } from "./actions";
import { Metrics } from "./metrics";
import { SkillsClient } from "./skill";
import { Credentials } from "./credentials";
import { ChangeSettings } from "./settings";

/**
 * @hidden
 */
export interface Client {
  user: User | null;
  actions: Actions;
  disconnect(): Promise<any>;
  getInfo(): Promise<any>;
  login?(credentials: Credentials): Promise<any>;
  observeNamespace(namespace: string): Observable<any>;
  metrics: Metrics;
  skills: SkillsClient;
  timestamp: number;
  changeSettings(settings: ChangeSettings): Promise<void>;
}
