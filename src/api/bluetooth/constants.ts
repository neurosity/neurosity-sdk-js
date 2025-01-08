/**
 * @hidden
 */
export enum BLUETOOTH_CONNECTION {
  DISCONNECTED = "disconnected",
  SCANNING = "scanning",
  CONNECTING = "connecting",
  CONNECTED = "connected"
}

/**
 * @hidden
 */
export const BLUETOOTH_PRIMARY_SERVICE_UUID_HEX =
  "0000fe84-0000-1000-8000-00805f9b34fb";

/**
 * @hidden
 */
export const BLUETOOTH_COMPANY_IDENTIFIER_HEX = 0x0438;

/**
 * @hidden
 */
export const BLUETOOTH_DEVICE_NAME_PREFIXES = ["Crown", "Notion"];

/**
 * @hidden
 */
export const BLUETOOTH_CHARACTERISTICS = {
  COMMAND: "command",
  ACTION: "action",
  STATUS: "status",
  INFO: "info"
} as const;

export type BluetoothCharacteristic = keyof typeof BLUETOOTH_CHARACTERISTICS;
