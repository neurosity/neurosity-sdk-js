export function isWebBluetoothSupported() {
  return window?.navigator?.bluetooth;
}
