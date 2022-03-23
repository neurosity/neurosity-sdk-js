import { pipe, interval } from "rxjs";
import {
  map,
  distinctUntilChanged,
  withLatestFrom
} from "rxjs/operators";

import { DeviceStatus } from "../types/status";

// `lastHeartbeat` is updated every 30 seconds via os
const lastHeartbeatUpdateInterval = 30000;
const maxHeartbeatsSkipped = 3;
const gracePeriod = 5000;

// 65 seconds
const lostHeartbeatThreshold =
  lastHeartbeatUpdateInterval * maxHeartbeatsSkipped + gracePeriod;

const heartbeatChecker$ = interval(lostHeartbeatThreshold);

export function offlineIfLostHeartbeat() {
  return pipe(
    withLatestFrom(heartbeatChecker$),
    map(([status, _]: [DeviceStatus, number]) => ({
      ...status,
      state: deviceHasLostHeartbeat(status) ? "offline" : status.state
    })),
    distinctUntilChanged(didObjectChange)
  );
}

export function deviceHasLostHeartbeat(status: DeviceStatus): boolean {
  if (!status?.lastHeartbeat) {
    return false;
  }

  const { lastHeartbeat } = status;

  const timeSinceLastHeartbeat = Date.now() - lastHeartbeat;
  const lostHeartbeat = timeSinceLastHeartbeat > lostHeartbeatThreshold;

  return lostHeartbeat;
}

function didObjectChange(a: any, b: any): boolean {
  return (
    JSON.stringify(a).split("").sort().join("") ===
    JSON.stringify(b).split("").sort().join("")
  );
}
