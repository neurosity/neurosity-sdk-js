import { TRANSPORT_TYPE } from "../types";

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8");

/**
 * @hidden
 * Uint8Array in Web | number[] in React Native
 */
export type BufferLike = Uint8Array | number[];

export function encode(
  transportType: TRANSPORT_TYPE,
  data: string
): BufferLike {
  if (transportType === TRANSPORT_TYPE.REACT_NATIVE) {
    // React Native expects a plain array  of numbers and not a Uint8Array
    return [...encoder.encode(data)];
  }

  return encoder.encode(data);
}

export function decode(
  transportType: TRANSPORT_TYPE,
  data: BufferLike
): string {
  if (transportType === TRANSPORT_TYPE.REACT_NATIVE) {
    // React Native outpouts a plain array of numbers and not a Uint8Array
    return decoder.decode(new Uint8Array(data as number[]));
  }

  return decoder.decode(data as Uint8Array);
}
