export type BrainwavesLabel =
  | "raw"
  | "rawUnfiltered"
  | "powerByBand"
  | "psd";

export type AmplitudeByChannel = number[][];

export interface Epoch {
  data: AmplitudeByChannel;
  info: {
    samplingRate: number;
    startTime: number;
  };
}

export type PSDByChannel = number[][];

export interface PSD {
  psd: PSDByChannel;
  freqs: number[];
  info: {
    samplingRate: number;
    startTime: number;
  };
}

export type BandName = "gamma" | "beta" | "alpha" | "theta" | "delta";

export interface PowerByBand {
  gamma: number[];
  beta: number[];
  alpha: number[];
  theta: number[];
  delta: number[];
}
