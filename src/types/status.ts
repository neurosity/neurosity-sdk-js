export interface DeviceStatus {
  battery: number;
  charging: boolean;
  state: "online" | "offline" | "updating" | "booting" | "shuttingOff";
  updatingProgress: number;
  ssid: string;
}
