import { timer, pipe, range, Observable } from "rxjs";
import { map, concatWith, filter, take } from "rxjs/operators";
import { bufferCount, concatMap, switchMap } from "rxjs/operators";
import outliers from "outliers";

import { whileOnline } from "../utils/whileOnline";
import { DeviceStatus } from "../types/status";

type Options = {
  getTimesync: () => Promise<number>;
  status$: Observable<DeviceStatus>;
  bufferSize?: number;
  updateInterval?: number;
};

const defaultOptions = {
  bufferSize: 100,
  updateInterval: 1 * 60 * 1000 // every minute
};

export class Timesync {
  options: Options;
  _offset: number = 0;

  constructor(options: Options) {
    this.options = {
      ...defaultOptions,
      ...options
    };

    this.start();
  }

  public start(): void {
    const { bufferSize, updateInterval, status$ } = this.options;

    const burst$ = range(0, bufferSize);
    const timer$ = timer(updateInterval, updateInterval).pipe(
      map((i: number) => bufferSize + i),
      whileOnline({
        status$,
        allowWhileOnSleepMode: true
      })
    );

    const firstTimeDeviceIsOnline$ = status$.pipe(
      filter((status: DeviceStatus) => status.state === "online"),
      take(1)
    );

    firstTimeDeviceIsOnline$
      .pipe(
        switchMap(() => {
          return burst$.pipe(
            concatWith(timer$),
            this.toOffset(),
            bufferCount(bufferSize, 1),
            this.filterOutliers(),
            map((list: number[]) => this.average(list))
          );
        })
      )
      .subscribe((offset) => {
        this._offset = offset;
      });
  }

  filterOutliers() {
    return pipe(
      map((offsets: number[]): number[] => {
        return offsets.filter(outliers());
      })
    );
  }

  toOffset() {
    const { getTimesync } = this.options;
    return pipe(
      concatMap(async () => {
        const requestStartTime = Date.now();
        const [error, serverTime] = await getTimesync()
          .then((offset) => [null, offset])
          .catch((error) => [error]);

        if (error) {
          return 0;
        }

        const responseEndTime = Date.now();
        const oneWayDuration = (responseEndTime - requestStartTime) / 2;
        const offset = responseEndTime - oneWayDuration - serverTime;
        return offset;
      })
    );
  }

  private average(list: number[]): number {
    return Math.round(
      list.reduce((acc, number) => acc + number) / list.length
    );
  }

  public get offset(): number {
    return this._offset;
  }

  public get timestamp(): number {
    return Date.now() + this._offset;
  }
}
