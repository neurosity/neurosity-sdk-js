export type UserDevice = {
  claimedOn: number;
};

export type UserDevices = {
  [deviceId: string]: UserDevice;
};

/**
 * @hidden
 */
export type UserClaims = {
  [claimName: string]: boolean | string;
};
