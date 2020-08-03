export interface DeviceInfo {
  deviceId: string;
  deviceNickname: string;
  channelNames: string[];
  channels: number;
  samplingRate: number;
  manufacturer: string;
  modelName: string;
  modelId: string;
  osVersion: string;
  apiVersion: string;
}

type DeviceSelectorKeyValue = [string, string | number | string[]];
type DeviceSelectorFunction = (devices: DeviceInfo[]) => DeviceInfo;

export type DeviceSelector =
  | DeviceSelectorKeyValue
  | DeviceSelectorFunction;
