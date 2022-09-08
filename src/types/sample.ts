import { Marker } from "./marker";

/**
 * @hidden
 */
export type Sample = {
  data: number[];
  timestamp: number;
  count?: number;
  marker?: Marker;
};

/**
 * @hidden
 */
export type CSVSample = number[];
