interface IMetricsSubscriber {
  onMetric(subscriptionId: string, callback: Function): void;
}

export default interface IOptions {
  deviceId: string;
  apiKey?: string;
  metricsAllowed?: string[];
  metricsSubscriber?: IMetricsSubscriber;
}
