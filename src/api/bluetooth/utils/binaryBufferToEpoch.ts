import { pipe, from, Observable, UnaryFunction } from "rxjs";
import { mergeMap } from "rxjs/operators";
import { Buffer } from "buffer/index.js"; // not including /index.js causes typescript to uses Node's native Buffer built-in and we want to use this npm package for both node and the browser

import { epoch, addInfo } from "../../../utils/pipes";
import { Sample } from "../../../types/sample";
import { Epoch } from "../../../types/epoch";
import { DeviceInfo } from "../../../types/deviceInfo";

const EPOCH_BUFFER_SIZE = 16;
const SAMPLING_RATE_FALLBACK = 256; // Crown's sampling rate

/** Size in bytes for each channel's payload. */
const TimestampSize = 8; // UInt64
const MarkerSize = 2; // UInt16
const ChannelDataSize = 8; // Double
/** Size in bytes for the static payload of every sample (Timestamp + Marker) */
const SampleFixedSize = TimestampSize + MarkerSize;

/**
 * @hidden
 */
export function binaryBufferToEpoch(
  deviceInfo: DeviceInfo
): UnaryFunction<Observable<Epoch>, any> {
  if (!deviceInfo?.samplingRate) {
    console.warn(
      `Didn't receive a sampling rate, defaulting to ${SAMPLING_RATE_FALLBACK}`
    );
  }

  return pipe(
    binaryBufferToSamples(deviceInfo.channels),
    epoch({
      duration: EPOCH_BUFFER_SIZE,
      interval: EPOCH_BUFFER_SIZE,
      samplingRate: deviceInfo?.samplingRate ?? SAMPLING_RATE_FALLBACK
    }),
    addInfo({
      channelNames: deviceInfo.channelNames,
      samplingRate: deviceInfo.samplingRate
    })
  );
}

/**
 * @hidden
 */
export function binaryBufferToSamples(
  channelCount: number
): UnaryFunction<any, any> {
  return pipe(
    mergeMap((arrayBuffer: Uint8Array): Observable<Sample> => {
      const buffer = Buffer.from(arrayBuffer);
      const decoded = decode(buffer, channelCount);
      return from(decoded); // `from` creates an Observable emission from each item (Sample) in the array
    })
  );
}

/**
 * @hidden
 *
 * Decode the supplied Buffer as a list of Sample.
 *
 * Supplied buffer's length must be multiple of
 * `encodedSampleSize(channelCount)`.
 *
 * NB: This method does not guarantee validity of decoded samples. When
 * supplied with a buffer of appropriate length, it will always return a
 * matching number of Sample8. Since the encoding protocol defines no
 * metadata/checksum, correctness must be guaranteed via test coverage.
 *
 * @param buffer Buffer with binary payload to decode.
 * @param channelCount Number of expected channels in each sample.
 *
 * @returns List of decoded Samples present in buffer.
 */
export function decode(buffer: Buffer, channelCount: number): Array<Sample> {
  let sampleLen = encodedSampleSize(channelCount);
  // Alternative: relax this check, process sampleLen at a time, discard remainder?
  if (buffer.length % sampleLen != 0) {
    throw new Error(
      `buffer.length (${buffer.length}) for ${channelCount} channels must be multiple of ${sampleLen}B)`
    );
  }

  let sampleCount = buffer.length / sampleLen;
  let samples = new Array<Sample>(sampleCount);

  for (let i = 0; i < sampleCount; i++) {
    let offset = i * sampleLen;
    let channelData = new Array<number>(channelCount);
    // Read 8 bytes for timestamp & advance offset
    let ts = buffer.readBigUInt64BE(offset);
    offset += TimestampSize;
    // Read 1 byte for marker & advance offset
    let marker = buffer.readUInt16BE(offset);
    offset += MarkerSize;
    // Read 8 bytes for each channel & advance offset
    for (let i = 0; i < channelCount; i++) {
      channelData[i] = buffer.readDoubleBE(offset);
      offset += ChannelDataSize;
    }

    samples[i] = {
      timestamp: Number(ts),
      // TODO: uncomment when ready
      // marker: marker,
      data: channelData
    };
  }

  return samples;
}

/**
 * @hidden
 *
 * Calculate the size of each sample based on the number of channels.
 *
 * Each sample has the following 3 segments:
 * - Timestamp: 8 bytes (UInt64); contains current time in millis since epoch)
 * - Marker: 2 bytes (UInt16); for classifier data
 * - Data: N * 8 bytes (Double), each entry representing data from a different
 *   electrode.
 *
 *  +-----------+--------+------------------+
 *  | timestamp | marker | data (e1 ... eN) |
 *  +-----------+--------+------------------+
 *
 * The number of entries for Data varies per hardware model. It can be assumed
 * to remain constant for the lifetime of the program.
 */
export function encodedSampleSize(channelCount: number): number {
  return SampleFixedSize + channelCount * ChannelDataSize;
}
