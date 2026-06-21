/**
 * Host-side device health snapshot emitted from the firmware Node API
 * (mirrors `getDeviceHealthStream(...)` in `firmware/bos/main/api/src/
 * services/cpu/deviceHealth.ts`).
 *
 * Used by Studio to render the device-health strip and by the analytics
 * container's adaptive refit throttle to decide when to back off STIG
 * refit cadence on the iMX8MM.
 */
export interface DeviceHealth {
  /** Per-core CPU load (0-100). Length matches the number of cores. */
  cpuLoadPerCore: number[];
  /** Free system memory in MB, sampled from `/proc/meminfo`. */
  memFreeMB: number;
  /** Free system memory as a fraction (0-1) of total. */
  memFreePct: number;
  /** SoC temperature in degrees Celsius. */
  thermalC: number;
  /**
   * `true` when the cpufreq governor has dropped the current frequency
   * meaningfully below `cpuinfo_max_freq` (thermal throttle event).
   */
  thermalThrottled: boolean;
  /** Wall-clock timestamp (ms since epoch) when the sample was taken. */
  ts: number;
}
