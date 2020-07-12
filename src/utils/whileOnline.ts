import { pipe, of, empty, Observable } from "rxjs";
import { flatMap, withLatestFrom } from "rxjs/operators";
import { DeviceStatus } from "../types/status";
import { MetricValue } from "../types/metrics";

export function whileOnline(status$: Observable<DeviceStatus>) {
  return pipe(
    withLatestFrom(status$),
    flatMap(([metric, status]: [MetricValue, DeviceStatus]) =>
      shouldAllowMetrics(status) ? of(metric) : empty()
    )
  );
}

function shouldAllowMetrics(status: DeviceStatus) {
  return status.state === "online" && !status.sleepMode;
}
