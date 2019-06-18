import { timer, pipe, range } from "rxjs";
import { map, concat, skip } from "rxjs/operators";
import { bufferCount, concatMap } from "rxjs/operators";
import outliers from "outliers";

type Options = {
  getTimesync: () => Promise<number>;
  bufferSize?: number;
  updateInterval?: number;
};

const defaultOptions = {
  bufferSize: 100,
  updateInterval: 1000
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
      .pipe(
        concat(timer$),
        this.toOffset(),
        bufferCount(bufferSize, 1),
        this.filterOutliers(),
        map(list => this.average(list))
      )
      .subscribe(offset => {
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
        const serverTime = await getTimesync();
        const responseEndtime = Date.now();
        const oneWayDuration = (responseEndtime - requestStartTime) / 2;
        return responseEndtime - oneWayDuration - serverTime;
      }),
      skip(1) // Firebase's 1st roundtrip always takes a while
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
