import { combineLatest, Observable, timer } from "rxjs";
import { map, startWith, switchMap } from "rxjs/operators";
import { withLatestFrom, distinctUntilChanged } from "rxjs/operators";
import isEqual from "fast-deep-equal";

import { DeviceStatus, STATUS } from "../types/status";

const HEARTBEAT_UPDATE_INTERVAL = 30_000; // 30 seconds - set by the OS
const LOST_LOCAL_HEARTBEAT_AFTER = HEARTBEAT_UPDATE_INTERVAL * 2.5; // 75 seconds
const LOST_REMOTE_HEARTBEAT_AFTER = 8.64e7; // 24 hours

export function heartbeatAwareStatus(
  status$: Observable<DeviceStatus>
): Observable<DeviceStatus> {
  const lastLocalHeartbeat$: Observable<number> = status$.pipe(
    map(({ lastHeartbeat }) => lastHeartbeat),
    distinctUntilChanged(),
    map(() => Date.now())
  );

  const lostHeartbeat$: Observable<void> = lastLocalHeartbeat$.pipe(
    switchMap(() => timer(LOST_LOCAL_HEARTBEAT_AFTER)),
    map(() => null),
    startWith(null)
  );

  return combineLatest({
    status: status$,
    lostHeartbeat: lostHeartbeat$ // @important - do not remove, adeed for state synchronization, value not used
  }).pipe(
    withLatestFrom(lastLocalHeartbeat$),
    map(([{ status }, lastLocalHeartbeat]) => {
      if (!lastLocalHeartbeat) {
        return status;
      }

      const lostHeartbeat = deviceHasLostHeartbeat(status, lastLocalHeartbeat);

      return lostHeartbeat
        ? {
            ...status,
            state: STATUS.OFFLINE
          }
        : status;
    }),
    distinctUntilChanged((a, b) => isEqual(a, b))
  );
}

export function deviceHasLostHeartbeat(
  status: DeviceStatus,
  lastLocalHeartbeat: number
): boolean {
  if (!("lastHeartbeat" in status)) {
    return false;
  }

  // We are converting the heartbeat to the local time because the previous
  // implementation that used the server timestamp had bug where SDK clients
  // running on hardware with drifted/out-of-sync clocks (cough cough Android)
  // would override the state to offline when the heartbeat was active.
  const lostLocalHeartbeat =
    Date.now() - lastLocalHeartbeat > LOST_LOCAL_HEARTBEAT_AFTER;

  if (lostLocalHeartbeat) {
    return true;
  }

  // Addresses devices with wrongful "online" state. This rarely happens, the
  // OS would have to crash without updating the state to "offline".
  const lostRemoteHeartbeat =
    Date.now() - status.lastHeartbeat > LOST_REMOTE_HEARTBEAT_AFTER;
  if (lostRemoteHeartbeat) {
    return true;
  }

  return false;
}
