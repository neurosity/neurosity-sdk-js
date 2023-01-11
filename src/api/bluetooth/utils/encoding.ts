import { TRANSPORT_TYPE } from "../types/index.js";

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8");

export function encode(
  transportType: TRANSPORT_TYPE,
  data: string
): Uint8Array | number[] {
  if (transportType === TRANSPORT_TYPE.REACT_NATIVE) {
    // React Native expects a plain array  of numbers and not a Uint8Array
    return [...encoder.encode(data)];
  }

  return encoder.encode(data);
}

export function decode(
  transportType: TRANSPORT_TYPE,
  data: Uint8Array | number[]
): string {
  if (transportType === TRANSPORT_TYPE.REACT_NATIVE) {
    // React Native outpouts a plain array of numbers and not a Uint8Array
    return decoder.decode(new Uint8Array(data as number[]));
  }

  return decoder.decode(data as Uint8Array);
}
