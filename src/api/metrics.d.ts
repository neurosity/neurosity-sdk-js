import ISubscription from "../subscription.d";

export default interface IMetrics {
  on(subscriptionId: string, callback: Function): void;
  subscribe(subscription: ISubscription): string;
  unsubscribe(subscriptionId: string): void;
}
