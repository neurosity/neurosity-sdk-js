import { Marker } from "./marker";

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
