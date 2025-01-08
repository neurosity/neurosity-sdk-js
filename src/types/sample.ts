import { Marker } from "./marker";

/**
 * @hidden
 */
export interface Sample {
  data: number[];
  timestamp: number;
  count?: number;
  marker?: Marker;
  info?: Record<string, unknown>;
}

/**
 * @hidden
 */
export type CSVSample = number[];
