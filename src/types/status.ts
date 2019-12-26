export interface DeviceStatus {
  battery: number;
  charging: boolean;
  state: "online" | "offline" | "updating" | "booting" | "shuttingOff";
  sleepMode: boolean;
  sleepModeReason: "updating" | "charging" | null;
  updatingProgress: number;
  ssid: string;
}
