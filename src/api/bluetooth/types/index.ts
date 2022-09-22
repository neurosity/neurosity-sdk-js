export type ActionOptions = {
  characteristicName: string;
  action: any;
};

export type SubscribeOptions = {
  characteristicName: string;
  manageNotifications?: boolean;
};

export enum STATUS {
  CONNECTED = "connected",
  CONNECTING = "connecting",
  DISCONNECTING = "disconnecting",
  DISCONNECTED = "disconnected"
}
