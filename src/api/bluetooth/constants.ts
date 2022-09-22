import { BLUETOOTH_CHARACTERISTICS } from "@neurosity/ipk";

export const ANDROD_MAX_MTU = 512;
export const DEFAULT_ACTION_RESPONSE_TIMEOUT = 1000 * 60; // 1 minute

// Reverse BLUETOOTH_CHARACTERISTICS key/values for easy lookup
export const CHARACTERISTIC_UUIDS_TO_NAMES = Object.fromEntries(
  Object.entries(BLUETOOTH_CHARACTERISTICS).map((entries) =>
    entries.reverse()
  )
);
