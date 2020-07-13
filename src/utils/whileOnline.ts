import { pipe, of, empty, Observable } from "rxjs";
import { flatMap, withLatestFrom } from "rxjs/operators";
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
    flatMap(([value, status]: [any, DeviceStatus]) =>
      shouldAllowMetrics(status, allowWhileOnSleepMode)
        ? of(value)
        : empty()
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
