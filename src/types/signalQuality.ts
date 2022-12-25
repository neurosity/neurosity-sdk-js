type ChannelQuality = {
  standardDeviation: number;
  status: "great" | "good" | "bad" | "noContact";
};

/**
 * Channel names for the Crown are `CP3, C3, F5, PO3, PO4, F6, C4, and CP4`
 * These channels may change in future versions
 * {@link ChannelQuality}
 */
export interface SignalQuality {
  [channelName: string]: ChannelQuality;
}
