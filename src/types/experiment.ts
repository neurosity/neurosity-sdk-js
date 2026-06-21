/**
 * Session kind. `training` covers classifier-training protocols (kinesis,
 * SSVEP, …); `recording` is a simple timed raw-EEG capture. Experiments
 * created before dual-mode are treated as `training`.
 */
export type SessionKind = "training" | "recording";
export type TrainingProtocol = "kinesis" | "ssvep";
export type RecordingState = "idle" | "running" | "complete" | "error";

export type Experiment = {
  deviceId: string;
  id: string;
  labels: string[];
  name: string;
  timestamp: number;
  totalTrials: number;
  userId: string;
  /** Free-form notes. */
  notes?: string;
  /** Session kind; defaults to `training` for pre-dual-mode docs. */
  kind?: SessionKind;
  /** Training-only: which classifier protocol. */
  protocol?: TrainingProtocol;
  /** Recording-only: planned duration in ms. */
  durationMs?: number;
  /** Recording-only: lifecycle state. */
  recordingState?: RecordingState;
  /** Recording-only: epoch ms the recording actually started. */
  recordingStartedAt?: number;
  /** Recording-only: resulting memory/recording id once complete. */
  recordingId?: string;
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
  /** Session kind. Defaults to `training`. */
  kind?: SessionKind;
  /** Training-only classifier protocol. Defaults to `kinesis`. */
  protocol?: TrainingProtocol;
  /** Recording-only planned duration in ms. Defaults to 5 minutes. */
  durationMs?: number;
  /** Free-form notes. */
  notes?: string;
};

/**
 * Status fields that can be simulated on an emulator device via
 * {@link Neurosity.setEmulatorStatus}.
 */
export type EmulatorStatusPatch = {
  /** Simulated connection/run state (e.g. `"online"`, `"offline"`). */
  state?: string;
  /** Simulated charging flag. */
  charging?: boolean;
};

/**
 * A marker dropped during an experiment recording, written under
 * `experiments/{experimentId}/markers`.
 */
export type ExperimentMarker = {
  /** The marker's id (present when read back via `onExperimentMarkers`). */
  id?: string;
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
