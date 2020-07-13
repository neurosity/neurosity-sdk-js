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
