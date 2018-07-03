export default interface IMetrics {
  on(metric: string, callback: Function): void;
  subscribe(metric: string, ...labels: string[]): void;
  unsubscribe(metric: string): void;
}
