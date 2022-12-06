/**
 * @hidden
 */
export enum STATUS {
  ONLINE = "online",
  OFFLINE = "offline",
  UPDATING = "updating",
  BOOTING = "booting",
  SHUTTING_OFF = "shuttingOff"
}

/**
 * @hidden
 */
export enum SLEEP_MODE_REASON {
  UPDATING = "updating",
  CHARGING = "charging"
}

export interface DeviceStatus {
  battery: number;
  charging: boolean;
  state: STATUS;
  sleepMode: boolean;
  sleepModeReason: SLEEP_MODE_REASON | null;
  lastHeartbeat: number;
  ssid: string;
}
