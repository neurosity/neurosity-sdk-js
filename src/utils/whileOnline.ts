import { pipe, of, EMPTY, Observable } from "rxjs";
import { mergeMap, withLatestFrom } from "rxjs/operators";
import { DeviceStatus } from "../types/status";

type Options = {
  status$: Observable<DeviceStatus>;
  allowWhileOnSleepMode: boolean;
};

export function whileOnline({
  status$,
  allowWhileOnSleepMode
}: Options) {
  return pipe(
    withLatestFrom(status$),
    mergeMap(([value, status]: [any, DeviceStatus]) =>
      shouldAllowMetrics(status, allowWhileOnSleepMode)
        ? of(value)
        : EMPTY
    )
  );
}

function shouldAllowMetrics(
  status: DeviceStatus,
  allowWhileOnSleepMode: boolean
) {
  return (
    status.state === "online" &&
    (allowWhileOnSleepMode ? true : !status.sleepMode)
  );
}
