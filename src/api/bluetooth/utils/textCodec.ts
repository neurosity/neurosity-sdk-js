import { Buffer } from "buffer/index.js"; // not including /index.js causes typescript to uses Node's native Buffer built-in and we want to use this npm package for both node and the browser

import { TRANSPORT_TYPE } from "../types";

/**
 * @hidden
 * Uint8Array in Web | number[] in React Native
 */
export type BufferLike = Uint8Array | number[];

/**
 * @hidden
 */
export class TextCodec {
  transportType: TRANSPORT_TYPE;
  webEncoder: TextEncoder;
  webDecoder: TextDecoder;

  constructor(transportType: TRANSPORT_TYPE) {
    this.transportType = transportType;

    if (transportType === TRANSPORT_TYPE.WEB) {
      this.webEncoder = new TextEncoder();
      this.webDecoder = new TextDecoder("utf-8");
    }
  }

  encode(data: string): BufferLike {
    if (this.transportType === TRANSPORT_TYPE.WEB) {
      const encoded: Uint8Array = this.webEncoder.encode(data);
      return encoded;
    }

    if (this.transportType === TRANSPORT_TYPE.REACT_NATIVE) {
      // React Native BLE Manager expects a number[] instead of a Uint8Array
      const encoded: number[] = [...Buffer.from(data)];
      return encoded;
    }

    const encoded: Buffer = Buffer.from(data);
    return encoded;
  }

  decode(arrayBuffer: Uint8Array): string {
    if (this.transportType === TRANSPORT_TYPE.WEB) {
      const decoded: string = this.webDecoder.decode(arrayBuffer);
      return decoded;
    }

    // For React Native, and as a default
    const decoded: string = Buffer.from(arrayBuffer).toString("utf-8");
    return decoded;
  }
}
