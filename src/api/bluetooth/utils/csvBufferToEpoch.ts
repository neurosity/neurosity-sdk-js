import { pipe, from, Observable, UnaryFunction } from "rxjs";
import { mergeMap, map } from "rxjs/operators";

import { epoch, addInfo } from "../../../utils/pipes.js";
import { Sample, CSVSample } from "../../../types/sample.js";
import { Epoch } from "../../../types/epoch.js";
import { DeviceInfo } from "../../../types/deviceInfo.js";

const EPOCH_BUFFER_SIZE = 16;
const SAMPLING_RATE_FALLBACK = 256; // Crown's sampling rate

/**
 * @hidden
 */
export function csvBufferToEpoch(
  deviceInfo: DeviceInfo
): UnaryFunction<Observable<Epoch>, any> {
  if (!deviceInfo?.samplingRate) {
    console.warn(
      `Didn't receive a sampling rate, defaulting to ${SAMPLING_RATE_FALLBACK}`
    );
  }

  return pipe(
    csvBufferToSamples(),
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
export function csvBufferToSamples(): UnaryFunction<any, any> {
  return pipe(
    mergeMap((samples: CSVSample[]): Observable<CSVSample> => from(samples)),
    map(
      ([timestamp, marker, ...data]: CSVSample): Sample => ({
        timestamp,
        data
      })
    )
  );
}
