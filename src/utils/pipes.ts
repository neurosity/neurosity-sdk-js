import { pipe, Observable, UnaryFunction } from "rxjs";
import { bufferCount, scan, filter, map } from "rxjs/operators";
import { Sample } from "../types/sample";
import { Epoch } from "../types/epoch";

const defaultSamplingRate = 256;

const isObject = (object: unknown): object is Record<string, unknown> =>
  object instanceof Object && object === Object(object);

type InfoFunction = (sample: Sample) => Record<string, unknown>;

const isFunction = (object: unknown): object is InfoFunction =>
  typeof object === "function";

const patch =
  (sample: Sample) =>
  (info: Record<string, unknown>): Sample => ({
    ...sample,
    info: {
      ...(sample?.info ?? {}),
      ...(info || {})
    }
  });

/**
 * Annotates stream with user-defined metadata
 * @method addInfo
 * @example eeg$.pipe(addinfo({ samplingRate: 256, channelNames: ["Af7", "Fp1", "Fp2", "Af8"] })
 * @param {Object} info Info to be added to the EEG stream. Relevant info may include: `samplingRate` and `channelNames`
 * @returns {Observable<Sample|Epoch|PSD>}
 */
export const addInfo = (
  infoValue: Record<string, unknown> | InfoFunction
): UnaryFunction<Observable<Sample>, Observable<Sample>> =>
  pipe(
    map((sample: Sample) => {
      if (
        !isObject(sample) ||
        (!isObject(infoValue) && !isFunction(infoValue))
      ) {
        return sample;
      }
      const info: Record<string, unknown> = isFunction(infoValue)
        ? infoValue(sample)
        : infoValue;
      return patch(sample)(info);
    })
  );

/**
 * Get a 2D array organized by channel from an array of Samples.
 * @method groupByChannel
 * @param {Array<Sample>} samplesBuffer Array of Samples to be grouped
 * @returns {Array<Array<number>>}
 */
const groupByChannel = (samplesBuffer: Sample[]): number[][] => {
  if (!samplesBuffer.length || !samplesBuffer[0].data) {
    return [];
  }
  return samplesBuffer[0].data.map((_, channelIndex: number) =>
    samplesBuffer.map((sample: Sample) => sample.data[channelIndex])
  );
};

/**
 * Takes an array or RxJS buffer of EEG Samples and returns an Epoch.
 * @method bufferToEpoch
 * @example eeg$.pipe(bufferTime(1000), bufferToEpoch({ samplingRate: 256 }))
 *
 * @param {Object} options - Data structure options
 * @param {number} [options.samplingRate] Sampling rate
 *
 * @returns {Observable<Epoch>}
 */
export const bufferToEpoch = ({
  samplingRate = defaultSamplingRate
} = {}): UnaryFunction<Observable<Sample[]>, Observable<Epoch>> =>
  pipe(
    map((samplesArray: Sample[]): Epoch => {
      if (!samplesArray.length) {
        return {
          data: [],
          info: {
            startTime: 0,
            samplingRate,
            channelNames: []
          }
        };
      }

      const info = samplesArray[0]?.info ?? {};
      const samplingRateFromInfo =
        typeof info.samplingRate === "number"
          ? info.samplingRate
          : samplingRate;

      return {
        data: groupByChannel(samplesArray),
        info: {
          ...info,
          startTime: samplesArray[0]?.timestamp ?? 0,
          samplingRate: samplingRateFromInfo
        }
      };
    })
  );

/**
 * Converts a stream of individual Samples of EEG data into a stream of Epochs of a given duration emitted at specified interval.
 * This operator functions similarly to a circular buffer internally and allows overlapping Epochs of data to be emitted
 * (e.g. emitting the last one second of data every 100ms).
 * @method epoch
 * @example eeg$.pipe(epoch({ duration: 1024, interval: 100, samplingRate: 256 }))
 * @param {Object} options - Epoching options
 * @param {number} [options.duration=256] Number of samples to include in each epoch
 * @param {number} [options.interval=100] Time (ms) between emitted Epochs
 * @param {number} [options.samplingRate=256] Sampling rate
 * @returns {Observable} Epoch
 */
export const epoch = ({
  duration = 256,
  interval = 100,
  samplingRate = defaultSamplingRate
}: {
  duration?: number;
  interval?: number;
  samplingRate?: number;
} = {}): UnaryFunction<Observable<Sample>, Observable<Epoch>> =>
  pipe(
    bufferCount(interval),
    scan((acc: Sample[], val: Sample[]) =>
      acc.concat(val).slice(acc.length < duration ? 0 : -duration)
    ),
    filter((samplesArray: Sample[]) => samplesArray.length === duration),
    bufferToEpoch({ samplingRate })
  );
