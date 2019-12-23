/**
 * @internal
 */
export interface Subscription {
  metric: string;
  labels: string[];
  atomic: boolean;
  id?: string;
  clientId?: string;
  serverType?: string;
}
