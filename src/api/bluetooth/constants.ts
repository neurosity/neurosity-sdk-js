import { BLUETOOTH_CHARACTERISTICS } from "@neurosity/ipk";

export const ANDROID_MAX_MTU: number = 512;
export const REACT_NATIVE_MAX_BYTE_SIZE: number = 512; // the default is 20

export const DEFAULT_ACTION_RESPONSE_TIMEOUT: number = 1000 * 60; // 1 minute

// Reverse BLUETOOTH_CHARACTERISTICS key/values for easy lookup
export const CHARACTERISTIC_UUIDS_TO_NAMES = Object.fromEntries(
  Object.entries(BLUETOOTH_CHARACTERISTICS).map((entries) => entries.reverse())
);
