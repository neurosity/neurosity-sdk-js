import { IWebsocketClient } from "./api/websocket/websocket.d";

export default interface IOptions {
  deviceId: string;
  apiKey?: string;
  metricsAllowed?: string[];
  websocket?: IWebsocketClient;
}
