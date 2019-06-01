export interface IWebsocketClient {
  serverType: string;
  onMetric(
    metricName: string,
    subscriptionId: string,
    callback: Function
  ): void;
  disconnect(): void;
}
