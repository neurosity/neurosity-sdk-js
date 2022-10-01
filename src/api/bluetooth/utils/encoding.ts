// https://github.com/feross/buffer
import Buffer from "buffer/";

import { TRANSPORT_TYPE } from "../types";

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8");

export function encode(
  transportType: TRANSPORT_TYPE,
  data: string
): Uint8Array {
  // ArrayLike<number>
  if (transportType === TRANSPORT_TYPE.REACT_NATIVE) {
    const encoded: Uint8Array = encoder.encode(data);
    return encoded;
    // BleManager only support plain array and not Uint8Array
    //return [...encoded] as Uint8Array;
  }

  return encoder.encode(data);
}

export function decode(
  transportType: TRANSPORT_TYPE,
  data: Uint8Array // BufferSource
): string {
  if (transportType === TRANSPORT_TYPE.REACT_NATIVE) {
    const buffer: Buffer.Buffer = Buffer.Buffer.from(data);
    return decoder.decode(buffer);
  }

  return decoder.decode(data);
}
