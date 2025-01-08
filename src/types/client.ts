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
  disconnect(): Promise<void>;
  getInfo(): Promise<Record<string, unknown>>;
  login?(credentials: Credentials): Promise<User>;
  observeNamespace(namespace: string): Observable<Record<string, unknown>>;
  metrics: Metrics;
  skills: SkillsClient;
  timestamp: number;
  changeSettings(settings: ChangeSettings): Promise<void>;
}
