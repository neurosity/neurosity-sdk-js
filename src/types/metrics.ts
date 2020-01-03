import { Subscription } from "./subscription";

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
    subscription: Subscription,
    callback: Function
  ): SubscriptionListener;
  subscribe(subscription: Subscription): Subscription;
  unsubscribe(
    subscription: Subscription,
    listener: SubscriptionListener
  ): void;
}
