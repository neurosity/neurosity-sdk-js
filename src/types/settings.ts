/**
 * @hidden
 */
export interface Settings {
  lsl: boolean;
  bluetooth: boolean;
  timesync: boolean;
  deviceNickname: string;
}

/**
 * @hidden
 */
export interface ChangeSettings {
  lsl?: boolean;
  bluetooth?: boolean;
  timesync?: boolean;
  deviceNickname?: string;
}
