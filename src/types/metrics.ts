import { Subscription } from "./subscription";

/**
 * @internal
 */
type SubscriptionListener = Function;

/**
 * @internal
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
