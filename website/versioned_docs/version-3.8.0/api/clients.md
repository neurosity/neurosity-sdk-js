---
id: version-3.8.0-clients
title: Clients
original_id: clients
---
Supported clients include

- Firebase
- (Custom Subscriber e.i. Websocket instance)

Clients should be classes with the following interface.

```ts
export interface IClient {
  actions: IActions;
  connect(callback?: Function): Promise<any>;
  disconnect(callback?: Function): Promise<any>;
  getInfo(): Promise<any>;
  metrics: IMetrics;
}
```