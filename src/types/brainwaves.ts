export type BrainwavesLabel = "raw" | "rawUnfiltered" | "powerByBand" | "psd";

export type AmplitudeByChannel = number[][];

export interface BaseInfo {
  samplingRate: number;
  startTime: number;
  channelNames: string[];
}

export interface EpochInfo extends BaseInfo {
  notchFrequency?: string;
}

export interface Epoch {
  data: AmplitudeByChannel;
  info: EpochInfo;
}

export interface RawUnfilteredEpochInfo extends BaseInfo {}

export interface RawUnfilteredEpoch {
  data: AmplitudeByChannel;
  info: RawUnfilteredEpochInfo;
}

export type PSDByChannel = number[][];

export interface PSDInfo extends BaseInfo {
  notchFrequency: string;
}

export interface PSD {
  label: "psd";
  psd: PSDByChannel;
  freqs: number[];
  info: PSDInfo;
}

export type BandName = "gamma" | "beta" | "alpha" | "theta" | "delta";

// PowerByBand includes an info object with sampling rate, start time, and channel names
// since this information is still relevant for frequency band analysis
export interface PowerByBand {
  gamma: number[];
  beta: number[];
  alpha: number[];
  theta: number[];
  delta: number[];
  info: BaseInfo;
}
