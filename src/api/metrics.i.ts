export default interface IMetrics {
  on(subscriptionId: string, callback: Function): void;
  subscribe(metric: string, label: string): string;
  unsubscribe(subscriptionId: string): void;
}
