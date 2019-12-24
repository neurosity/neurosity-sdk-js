type ChannelQuality = {
  standardDeviation: number;
  status: "great" | "good" | "bad" | "noContact";
};

/**
 * Channel names for Notion are `CP6, F6, C4, CP4, CP3, F5, C3 and CP5`
 * These channels may change in future versions
 * {@link ChannelQuality}
 */
export interface SignalQuality {
  [channelName: string]: ChannelQuality;
}
