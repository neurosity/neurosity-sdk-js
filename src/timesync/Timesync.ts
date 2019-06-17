import { timer, pipe, range } from "rxjs";
import { map, filter, concat } from "rxjs/operators";
import { bufferCount, concatMap } from "rxjs/operators";

type Options = {
  getTimesync: () => Promise<number>;
  bufferSize?: number;
  updateInterval?: number;
};

const defaultOptions = {
  bufferSize: 25,
  updateInterval: 1000 // @TODO: every 120s
};

export class Timesync {
  options: Options;
  _offset: number = 0;

  constructor(options: Options) {
    this.options = {
      ...defaultOptions,
      ...options
    };

    this.starTimer();
  }

  private starTimer(): void {
    const { bufferSize, updateInterval } = this.options;
    const burst$ = range(0, bufferSize);
    const timer$ = timer(updateInterval, updateInterval);

    burst$
      .pipe(concat(timer$))
      .pipe(
        this.toOffset(),
        this.filterOutliers(),
        bufferCount(bufferSize, 1),
        map(this.average)
      )
      .subscribe(offset => {
        console.log("offset", offset);
        this._offset = offset;
      });
  }

  filterOutliers() {
    return pipe(
      filter((offset: number) => {
        return (
          this._offset === 0 ||
          Math.abs(offset) < Math.abs((0.1 + this._offset) * 3)
        );
      })
    );
  }

  toOffset() {
    const { getTimesync } = this.options;
    return pipe(
      concatMap(async () => {
        const requestStartTime = Date.now();
        const serverTime = await getTimesync();
        const responseEndtime = Date.now();
        const oneWayDuration = (responseEndtime - requestStartTime) / 2;
        console.log("oneWayDuration", oneWayDuration);
        return responseEndtime - oneWayDuration - serverTime;
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
