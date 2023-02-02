import { TRANSPORT_TYPE } from "../types";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder("utf-8");

/**
 * @hidden
 * Uint8Array in Web | number[] in React Native
 */
export type BufferLike = Uint8Array | number[];

export function encodeText(
  transportType: TRANSPORT_TYPE,
  data: string
): BufferLike {
  if (transportType === TRANSPORT_TYPE.REACT_NATIVE) {
    // React Native expects a plain array  of numbers and not a Uint8Array
    return [...textEncoder.encode(data)];
  }

  return textEncoder.encode(data);
}

export function decodeText(arrayBuffer: Uint8Array): string {
  return textDecoder.decode(arrayBuffer);
}
