export interface DeviceInfo {
  deviceId: string;
  deviceNickname: string;
  channelNames: string[];
  channels: number;
  samplingRate: number;
  manufacturer: string;
  model: string;
  modelName: string;
  modelVersion: string;
  osVersion: string;
  apiVersion: string;
  emulator?: boolean;
}

type DeviceSelectorKeyValue = [string, string | number | string[]];
type DeviceSelectorFunction = (devices: DeviceInfo[]) => DeviceInfo;

export type DeviceSelector = DeviceSelectorKeyValue | DeviceSelectorFunction;
