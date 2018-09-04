export interface ITrainingRecording {
  experimentId: string;
  metric: string;
  label: string;
  fit?: boolean;
  baseline?: boolean;
  timestamp?: number;
}

export interface ITraining {
  record(training: ITrainingRecording): void;
}
