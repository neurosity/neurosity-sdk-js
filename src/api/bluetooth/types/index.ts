/**
 * @hidden
 */
export type ActionOptions = {
  characteristicName: string;
  action: any;
};

/**
 * @hidden
 */
export type SubscribeOptions = {
  characteristicName: string;
  manageNotifications?: boolean;
  skipJSONDecoding?: boolean;
};

/**
 * @hidden
 */
export enum BLUETOOTH_CONNECTION {
  SCANNING = "scanning",
  CONNECTED = "connected",
  CONNECTING = "connecting",
  DISCONNECTING = "disconnecting",
  DISCONNECTED = "disconnected"
}

/**
 * @hidden
 */
export enum TRANSPORT_TYPE {
  WEB = "web",
  REACT_NATIVE = "reactNative"
}
