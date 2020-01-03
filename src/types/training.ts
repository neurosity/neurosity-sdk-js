/**
 * @hidden
 */
export interface TrainingRecording {
  experimentId: string;
  metric: string;
  label: string;
  fit?: boolean;
  baseline?: boolean;
  timestamp?: number;
}

/**
 * @hidden
 */
export interface Training {
  record(training: TrainingRecording): void;
  stop(training: TrainingRecording): void;
  stopAll(): void;
}
