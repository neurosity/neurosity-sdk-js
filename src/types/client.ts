import { Observable } from "rxjs";
import { User } from "@firebase/auth-types";
import { Actions } from "./actions.js";
import { Metrics } from "./metrics.js";
import { Credentials } from "./credentials.js";
import { ChangeSettings } from "./settings.js";

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
  timestamp: number;
  changeSettings(settings: ChangeSettings): Promise<void>;
}
