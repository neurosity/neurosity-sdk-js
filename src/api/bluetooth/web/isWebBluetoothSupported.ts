import { isMaybeWebWorkerContext } from "./isMaybeWebWorkerContext";

export function isWebBluetoothSupported() {
  return (
    typeof window !== "undefined" &&
    window?.navigator?.bluetooth &&
    !isMaybeWebWorkerContext()
  );
}
