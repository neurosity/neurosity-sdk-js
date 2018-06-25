export default interface IBosClient {
  on(): void;
  emit(): void;
  connect(): Promise<any>;
  disconnect(): Promise<any>;
};
