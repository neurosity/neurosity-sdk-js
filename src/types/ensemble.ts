/**
 * Crown Community Ensembles — public types.
 *
 * Backs the R2 SDK additions on top of STIG (Spectral Transfer Learning
 * using Information Geometry). All ensemble behavior is additive: the
 * existing `kinesis(label)` semantics are unchanged for users with no
 * ensemble enabled. When an ensemble is enabled for a label,
 * `kinesis(label)` is transparently STIG-backed via the firmware
 * resolver — apps don't need to opt into a separate method to receive
 * the boost.
 */

/** Options accepted by `neurosity.kinesisEnsemble(...)`. */
export interface KinesisEnsembleOptions {
  /** Kinesis label (e.g. `"leftArm"`, `"push"`). */
  label: string;
  /**
   * `"auto"` — let the resolver pick a hardware-matched ensemble.
   * `"manual"` — use the explicit `ensembleId` or `classifierIds`.
   * Defaults to `"auto"`.
   */
  mode?: "auto" | "manual";
  /** Resolver-known ensemble identifier (manual mode). */
  ensembleId?: string;
  /** Explicit donor classifier IDs (manual mode). */
  classifierIds?: string[];
  /** Refit interval in seconds (overrides the device default). */
  refitIntervalSecs?: number;
  /** Toggle on-device spectral transfer learning. */
  spectralLearning?: boolean;
}

/** Live status of an active ensemble session. */
export interface EnsembleStatus {
  active: boolean;
  donorCount: number;
  personalizationScore: number;
  /** Wall-clock ms timestamp of the last successful refit. */
  lastRefitAt: number;
  /** Current refit cadence after any adaptive throttle. */
  currentRefitIntervalSecs: number;
}

/** A classifier the current user has trained. */
export interface MyClassifier {
  id: string;
  label: string;
  trainedAt: number;
  repCount: number;
  sharingEnabled: boolean;
  /** `null` until the cloud gate evaluation has run. */
  passedGate: boolean | null;
  /** `null` until the cloud gate evaluation has run. */
  gateScore: number | null;
  stats?: {
    activeDeviceCount: number;
    fleetWeightP50: number;
    lastUsedAt: number;
  };
}

/** A discoverable ensemble (system-curated or community-curated). */
export interface EnsembleSummary {
  id: string;
  name: string;
  classifierCount: number;
  kind: "system_curated" | "user_curated";
  hardware: {
    modelId: string;
    sampleRate: number;
    channels: string[];
  };
  /** Up-votes when applicable (user_curated). */
  votes?: number;
  updatedAt: number;
}
