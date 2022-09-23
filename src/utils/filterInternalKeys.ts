import { MonoTypeOperatorFunction, pipe } from "rxjs";
import { map } from "rxjs/operators";
import { DeviceStatus } from "../types/status";

export function filterInternalKeys(): MonoTypeOperatorFunction<DeviceStatus> {
  return pipe(
    map((status: DeviceStatus): DeviceStatus => {
      if (!status) {
        return status;
      }

      // remove internal properties that start with "__"
      const filteredStatus: any = Object.entries(status).reduce(
        (acc, [key, value]) => {
          if (!key.startsWith("__")) {
            acc[key] = value;
          }
          return acc;
        },
        {}
      );

      return filteredStatus;
    })
  );
}
