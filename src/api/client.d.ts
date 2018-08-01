import IActions from "./actions.d";
import IMetrics from "./metrics.d";

export default interface IClient {
  actions: IActions;
  connect(callback?: Function): Promise<any>;
  disconnect(callback?: Function): Promise<any>;
  getInfo(): Promise<any>;
  onStatus(callback?: Function): void;
  metrics: IMetrics;
  timestamp: number;
}
