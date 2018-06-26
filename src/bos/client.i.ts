export default interface IBosClient {
  // onMetric(): void;
  // onStatusChange(): void;
  // subscribe(): void;
  // unsubscribe(): void;
  connect(): Promise<any>;
  disconnect(): Promise<any>;
};
