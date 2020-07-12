import { PendingSubscription, Subscription } from "./subscriptions";

/**
 * @hidden
 */
type SubscriptionListener = Function;

/**
 * @hidden
 */
export type MetricValue = { [label: string]: any };

/**
 * @hidden
 */
export interface Metrics {
  next(metricName: string, metricValue: MetricValue): void;
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
