// https://github.com/feross/buffer
import Buffer from "buffer/";

export const encoder = new TextEncoder();
export const decoder = new TextDecoder("utf-8");

export function decodeBuffer(data: Uint8Array): string {
  const buffer = Buffer.Buffer.from(data);

  return decoder.decode(buffer);
}

export function encodeData(data: string): number[] {
  const encoded: Uint8Array = encoder.encode(data);

  return [...encoded]; // BleManager only support plain array and not Uint8Array
}
