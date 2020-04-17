export interface Settings {
  lsl: boolean;
  supportAccess: boolean;
  activityLogging: boolean;
}

/**
 * @hidden
 */
export interface ChangeSettings {
  lsl?: boolean;
  supportAccess?: boolean;
  activityLogging?: boolean;
}
