/**
 * @hidden
 */
export interface PendingSubscription {
  metric: string;
  labels: string[];
  atomic: boolean;
}

/**
 * @hidden
 */
export interface Subscription extends PendingSubscription {
  id: string;
  clientId: string;
  serverType: string;
}

/**
 * @hidden
 */
export interface Subscriptions {
  [id: string]: Subscription;
}
