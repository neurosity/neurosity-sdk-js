import { PendingSubscription, Subscription } from "./subscriptions";

/**
 * @hidden
 */
type SubscriptionListener = (metricValue: MetricValue) => void;

/**
 * @hidden
 */
export type MetricValue = Record<string, unknown>;

/**
 * @hidden
 */
export interface Metrics {
  next(metricName: string, metricValue: MetricValue): void;
  on(
    subscription: PendingSubscription,
    callback: (metricValue: MetricValue) => void
  ): SubscriptionListener;
  subscribe(subscription: PendingSubscription): Subscription;
  unsubscribe(subscription: Subscription, listener: SubscriptionListener): void;
}
