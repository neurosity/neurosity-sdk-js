import { pipe } from "rxjs";
import { bufferCount, scan, filter, map } from "rxjs/operators";

import { Sample } from "../types/sample";

const defaultDataProp = "data";
const defaultSamplingRate = 256;

const isObject = (object) =>
  object instanceof Object && object === Object(object);
const isFunction = (object) => typeof object === "function";

const patch = (sample: Sample) => (info: any) => ({
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
export const addInfo = (infoValue: any) =>
  pipe(
    map((sample: any) => {
      if (
        !isObject(sample) ||
        (!isObject(infoValue) && !isFunction(infoValue))
      ) {
        return sample;
      }
      const info: any = isFunction(infoValue) ? infoValue(sample) : infoValue;
      return patch(sample)(info);
    })
  );

/**
 * Get a 2D data array organized by channel from an array of Samples. Credit to Ken from Seattle's elegant transposition
 * http://www.codesuck.com/2012/02/transpose-javascript-array-in-one-line.html
 * @method groupByChannel
 * @param {Array<Sample>} samplesBuffer Array of Samples to be grouped
 * @param {string} [dataProp] Name of the key associated with EEG data
 * @returns {Array<Array<number>>}
 */

const groupByChannel = (samplesBuffer, dataProp = defaultDataProp) =>
  samplesBuffer[0][dataProp].map((_, channelIndex) =>
    samplesBuffer.map((sample) => sample[dataProp][channelIndex])
  );

/**
 * Takes an array or RxJS buffer of EEG Samples and returns an Epoch.
 * @method bufferToEpoch
 * @example eeg$.pipe(bufferTime(1000), bufferToEpoch({ samplingRate: 256 }))
 *
 * @param {Object} options - Data structure options
 * @param {number} [options.samplingRate] Sampling rate
 * @param {string} [options.dataProp='data'] Name of the key associated with eeg data
 *
 * @returns {Observable<Epoch>}
 */
export const bufferToEpoch = ({
  samplingRate = defaultSamplingRate,
  dataProp = defaultDataProp
} = {}) =>
  pipe(
    map((samplesArray) => ({
      [dataProp]: groupByChannel(samplesArray, dataProp),
      info: {
        ...(samplesArray[0] && samplesArray[0].info
          ? samplesArray[0].info
          : {}),
        startTime: samplesArray[0].timestamp,
        samplingRate:
          samplesArray[0].info && samplesArray[0].info.samplingRate
            ? samplesArray[0].info.samplingRate
            : samplingRate
      }
    }))
  );

/**
 * Converts a stream of individual Samples of EEG data into a stream of Epochs of a given duration emitted at specified interval. This operator functions similarly to a circular buffer internally and allows overlapping Epochs of data to be emitted (e.g. emitting the last one second of data every 100ms).
 * @method epoch
 * @example eeg$.pipe(epoch({ duration: 1024, interval: 100, samplingRate: 256 }))
 * @param {Object} options - Epoching options
 * @param {number} [options.duration=256] Number of samples to include in each epoch
 * @param {number} [options.interval=100] Time (ms) between emitted Epochs
 * @param {number} [options.samplingRate=256] Sampling rate
 * @param {string} [options.dataProp='data'] Name of the key associated with eeg data
 * @returns {Observable} Epoch
 */
export const epoch = ({
  duration,
  interval,
  samplingRate,
  dataProp = defaultDataProp
}) =>
  pipe(
    bufferCount(interval),
    scan((acc, val) =>
      acc.concat(val).slice(acc.length < duration ? 0 : -duration)
    ),
    filter((samplesArray) => samplesArray.length === duration),
    bufferToEpoch({ samplingRate, dataProp })
  );
