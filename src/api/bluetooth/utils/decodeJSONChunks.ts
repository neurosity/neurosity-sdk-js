import { map, pipe } from "rxjs";

import { stitchChunks } from "./stitch";
import { TextCodec } from "./textCodec";

/**
 * @hidden
 */
type Options = {
  textCodec: TextCodec;
  characteristicName: string;
  delimiter: string;
  addLog: (message: string) => void;
};

/**
 * @hidden
 */
export function decodeJSONChunks({
  textCodec,
  characteristicName,
  delimiter,
  addLog
}: Options) {
  return pipe(
    map((arrayBuffer: Uint8Array): string => {
      const decoded: string = textCodec.decode(arrayBuffer);

      addLog(
        `Received chunk with buffer size of ${arrayBuffer.byteLength} and decoded size ${decoded.length} for ${characteristicName} characteristic: \n${decoded}`
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
