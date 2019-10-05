import ISubscription from "./subscription";

type SubscriptionListener = Function;

export default interface IMetrics {
  next(metricName: string, metricValue: { [label: string]: any }): void;
  on(
    subscription: ISubscription,
    callback: Function
  ): SubscriptionListener;
  subscribe(subscription: ISubscription): ISubscription;
  unsubscribe(
    subscription: ISubscription,
    listener: SubscriptionListener
  ): void;
}
