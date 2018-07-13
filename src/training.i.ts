export interface ITrainingRecording {
  metric: string;
  label: string;
  fit: boolean;
  timestamp: Date;
}

export default interface ITraining {
  record(training: ITrainingRecording): void;
}
