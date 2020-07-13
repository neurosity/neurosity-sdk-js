export type UserDevice = {
  claimedOn: number;
};

export type UserDevices = {
  [deviceId: string]: UserDevice;
};
