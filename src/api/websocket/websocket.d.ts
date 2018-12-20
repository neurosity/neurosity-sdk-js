export interface IWebsocketClient {
  serverType: string;
  onMetric(subscriptionId: string, callback: Function): void;
}
