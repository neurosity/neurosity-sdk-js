export default interface ISubscription {
  metric: string;
  labels: string[];
  group: boolean;
}