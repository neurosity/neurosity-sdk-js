import { MonoTypeOperatorFunction, pipe, timer } from "rxjs";
import { distinctUntilChanged, map, switchMap } from "rxjs/operators";

import { DeviceStatus } from "../types/status";

// `lastHeartbeat` is updated every 30 seconds via os
const lastHeartbeatUpdateInterval = 30000;
const maxHeartbeatsSkipped = 3;
const gracePeriod = 5000;

// 65 seconds
const lostHeartbeatThreshold =
  lastHeartbeatUpdateInterval * maxHeartbeatsSkipped + gracePeriod;

export function offlineIfLostHeartbeat() {
  return pipe(
    switchMap((status: DeviceStatus) =>
      timer(0, lostHeartbeatThreshold).pipe(
        map(() => {
          if (deviceHasLostHeartbeat(status)) {
            return {
              ...status,
              state: "offline"
            };
          }

          return status;
        })
      )
    ),
    distinctUntilChanged(didObjectChange)
  );
}

export function deviceHasLostHeartbeat(status: DeviceStatus): boolean {
  if (!("lastHeartbeat" in status)) {
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
