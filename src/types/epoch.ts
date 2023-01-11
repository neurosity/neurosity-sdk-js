import { Marker } from "./marker.js";

/**
 * @hidden
 */
export type Epoch = {
  data: number[];
  info?: {
    channelNames?: string[];
    samplingRate?: number;
    marker?: Marker[];
  };
};
