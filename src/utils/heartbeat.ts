import { pipe, interval } from "rxjs";
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
    switchMap((status: DeviceStatus) => {
      console.log(
        "************ offlineIfLostHeartbeat switchMap() ************",
        status
      );

      return interval(lostHeartbeatThreshold).pipe(
        map(() => {
          console.log(
            "************ offlineIfLostHeartbeat map() ************",
            status
          );
          if (deviceHasLostHeartbeat(status)) {
            console.log(
              "************ deviceHasLostHeartbeat() ************",
              deviceHasLostHeartbeat(status)
            );
            return {
              ...status,
              state: "offline"
            };
          }

          console.log("************ no override ************", status);

          return status;
        })
      );
    }),
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
