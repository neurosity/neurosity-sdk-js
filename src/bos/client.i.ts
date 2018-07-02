import IActions from "./actions.i";

export default interface IClient {
  actions: IActions;
  getInfo(): Promise<any>;
  onMetric(metric: string, callback: Function): void;
  subscribe(metric: string, ...labels: string[]): void;
  unsubscribe(metric: string): void;
  connect(callback?: Function): Promise<any>;
  disconnect(callback?: Function): Promise<any>;
}
