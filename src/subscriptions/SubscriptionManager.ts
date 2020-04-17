import { Subscription, Subscriptions } from "../types/subscriptions";

/**
 * @hidden
 */
export class SubscriptionManager {
  private _subscriptions: Subscriptions = {};

  public get(): Subscriptions {
    return this._subscriptions;
  }

  public toList(): Subscription[] {
    return Object.values(this._subscriptions);
  }

  public add(subscription: Subscription): void {
    this._subscriptions[subscription.id] = subscription;
  }

  public remove(subscription: Subscription): void {
    if (!(subscription.id in this._subscriptions)) {
      return;
    }

    Reflect.deleteProperty(this._subscriptions, subscription.id);
  }
}
