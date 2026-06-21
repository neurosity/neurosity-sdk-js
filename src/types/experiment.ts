export type Experiment = {
  deviceId: string;
  id: string;
  labels: string[];
  name: string;
  timestamp: number;
  totalTrials: number;
  userId: string;
};

/**
 * Options for creating a new experiment via
 * {@link Neurosity.createUserExperiment}.
 */
export type CreateExperimentOptions = {
  /** The device the experiment is associated with. */
  deviceId: string;
  /** Display name. Defaults to a timestamped name when omitted. */
  name?: string;
  /** Initial classifier labels (e.g. `["leftHandPinch", "drop"]`). */
  labels?: string[];
};

/**
 * A marker dropped during an experiment recording, written under
 * `experiments/{experimentId}/markers`.
 */
export type ExperimentMarker = {
  /** The label/event this marker represents. */
  label: string;
  /** Epoch milliseconds when the marker occurred. */
  timestamp: number;
  /** Offset from the recording's start, in milliseconds. */
  offsetMs?: number;
  /** Whether the SDK's on-device `addMarker` acknowledged. */
  sdkAck?: boolean;
};

/**
 * A single training trial result, written under `trials/{experimentId}`.
 * Loosely typed so callers can attach protocol-specific fields; `timestamp`
 * defaults to a server timestamp when omitted.
 */
export type ExperimentTrial = {
  timestamp?: number;
  [key: string]: unknown;
};

/**
 * A model prediction captured during/after training, written under
 * `predictions/{experimentId}`.
 */
export type ExperimentPrediction = {
  /** Index of the trial this prediction belongs to. */
  trial: number;
  /** Predicted label. */
  label: string;
  /** Probability in `[0, 1]`. */
  probability: number;
  /** Metric the prediction came from (e.g. `"kinesis"`). */
  metric: string;
  /** Whether this was a baseline (rest) prediction. */
  baseline?: boolean;
  /** Epoch milliseconds; defaults to a server timestamp when omitted. */
  timestamp?: number;
};
