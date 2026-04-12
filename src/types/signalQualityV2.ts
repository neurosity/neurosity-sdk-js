export type SignalStatus = {
  /** Normalized score from 0-1, where higher is better */
  score: number;
  /** Standard deviation in microvolts */
  standardDeviation: number;
  /** Spectrum slope (power per frequency unit) */
  spectrumSlope: number;
  /** "adequate" when score >= threshold, "degraded" otherwise */
  status: "adequate" | "degraded";
};

export interface SignalQualityV2 {
  timestamp: number;
  /** Median signal quality across all channels */
  overall: SignalStatus;
  /** Per-channel signal quality */
  byChannel: {
    [channelName: string]: SignalStatus;
  };
}
