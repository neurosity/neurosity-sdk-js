import { timer, pipe, range } from "rxjs";
import { map, concat } from "rxjs/operators";
import { bufferCount, concatMap } from "rxjs/operators";
import outliers from "outliers";

type Options = {
  getTimesync: () => Promise<number>;
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

    this.starTimer();
  }

  private starTimer(): void {
    const { bufferSize, updateInterval } = this.options;
    const burst$ = range(0, bufferSize);
    const timer$ = timer(updateInterval, updateInterval).pipe(
      map(i => bufferSize + i)
    );

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
      map(
        (offsets: number[]): number[] => {
          return offsets.filter(outliers());
        }
      )
    );
  }

  toOffset() {
    const { getTimesync } = this.options;
    return pipe(
      concatMap(async () => {
        const requestStartTime = Date.now();
        const [error, serverTime] = await getTimesync()
          .then(offset => [null, offset])
          .catch(error => [error]);

        if (error) {
          console.log(error);
          return 0;
        }

        const responseEndtime = Date.now();
        const oneWayDuration = (responseEndtime - requestStartTime) / 2;
        const offset = responseEndtime - oneWayDuration - serverTime;
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
