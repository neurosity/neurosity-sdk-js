import semverGte from "semver/functions/gte";

import { DeviceInfo } from "../../../types/deviceInfo";

export function osHasBluetoothSupport(selectedDevice: DeviceInfo) {
  if (!selectedDevice) {
    return false;
  }

  // Only the Crown supports Bluetooth
  const isCrown = Number(selectedDevice.modelVersion) >= 3;
  if (!isCrown) {
    return false;
  }

  const isEmulator = !!selectedDevice?.emulator;
  if (isEmulator) {
    return false;
  }

  return semverGte(selectedDevice.osVersion, "16.0.0");
}
