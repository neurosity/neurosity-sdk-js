import ISubscription from "../subscription.d";

export default interface IMetrics {
  next(metricName: string, metricValue: { [label: string]: any }): void;
  on(subscriptionId: string, callback: Function): void;
  subscribe(subscription: ISubscription): string;
  unsubscribe(subscriptionId: string): void;
}
