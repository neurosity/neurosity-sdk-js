import { map, pipe } from "rxjs";

import { stitchChunks } from "./stitch";
import { decode, BufferLike } from "./encoding";
import { TRANSPORT_TYPE } from "../types/index";

/**
 * @hidden
 */
type Options = {
  transportType: TRANSPORT_TYPE;
  characteristicName: string;
  delimiter: string;
  addLog: (message: string) => void;
};

/**
 * @hidden
 */
export function decodeJSONChunks({
  transportType,
  characteristicName,
  delimiter,
  addLog
}: Options) {
  return pipe(
    // Uint8Array in Web | number[] in React Native
    map((buffer: BufferLike): string => {
      const decoded = decode(transportType, buffer);

      const length =
        buffer instanceof Uint8Array ? buffer.byteLength : buffer.length;

      addLog(
        `Received chunk with buffer size of ${length} and decoded size ${decoded.length} for ${characteristicName} characteristic: \n${decoded}`
      );

      return decoded;
    }),
    stitchChunks({ delimiter }),
    map((payload: any) => {
      try {
        return JSON.parse(payload);
      } catch (error) {
        addLog(
          `Failed to parse JSON for ${characteristicName} characteristic. Falling back to unparsed string. ${
            error?.message ?? error
          }`
        );

        return payload;
      }
    })
  );
}
