import { Marker } from "./marker";

/**
 * @hidden
 */
export interface Epoch {
  data: number[][];
  info: {
    startTime: number;
    samplingRate: number;
    [key: string]: unknown;
  };
}
