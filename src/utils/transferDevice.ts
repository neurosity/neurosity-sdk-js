export type TransferDeviceByEmail = {
  recipientsEmail: string;
  deviceId: string;
};

export type TransferDeviceByUserId = {
  recipientsUserId: string;
  deviceId: string;
};

export type TransferDeviceOptions =
  | TransferDeviceByEmail
  | TransferDeviceByUserId;
