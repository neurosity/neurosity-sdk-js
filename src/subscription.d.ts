export default interface ISubscription {
  metric: string;
  labels: string[];
  atomic: boolean;
  id?: string;
  clientId?: string;
  serverType?: string;
}
