import { PendingSubscription, Subscription } from "./subscriptions";

/**
 * @hidden
 */
type SubscriptionListener = Function;

/**
 * @hidden
 */
export interface Metrics {
  next(metricName: string, metricValue: { [label: string]: any }): void;
  on(
    subscription: PendingSubscription,
    callback: Function
  ): SubscriptionListener;
  subscribe(subscription: PendingSubscription): Subscription;
  unsubscribe(
    subscription: Subscription,
    listener: SubscriptionListener
  ): void;
}
