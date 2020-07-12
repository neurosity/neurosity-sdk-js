export type UserDevice = {
  claimedOn: number;
};

export type UserDevices = {
  [deviceId: string]: UserDevice;
};

export type DeviceInfo = {
  apiVersion: string;
  channelNames: string[];
  channels: number;
  deviceId: string;
  deviceNickname: string;
  manufacturer: string;
  modelName: string;
  osVersion: string;
  samplingRate: number;
};

export type Device = DeviceInfo & UserDevice;
