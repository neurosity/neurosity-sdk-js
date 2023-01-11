import { isMaybeWebWorkerContext } from "./isMaybeWebWorkerContext.js";

export function isWebBluetoothSupported() {
  return (
    typeof window !== "undefined" &&
    window?.navigator?.bluetooth &&
    !isMaybeWebWorkerContext()
  );
}
