import semverGte from "semver/functions/gte";
import valid from "semver/functions/valid";

import { DeviceInfo, OSVersion } from "../../../types/deviceInfo";

export function osHasBluetoothSupport(
  selectedDevice: DeviceInfo,
  osVersion?: OSVersion
) {
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

  // `osVersion` is updated in real time,
  // unlike accessing via `selectedDevice.osVersion`
  return semverGte(osVersion ?? selectedDevice.osVersion, "16.0.0");
}
