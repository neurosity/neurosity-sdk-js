export interface ChannelQualityV2 {
  score: number; // 0-1 normalized
}

export interface SignalQualityV2 {
  timestamp: number;
  overall: {
    score: number;
  };
  byChannel: {
    [channelName: string]: ChannelQualityV2;
  };
}
