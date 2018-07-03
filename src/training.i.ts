export interface ITrainingRecording {
  metric: string;
  label: string;
  fit: boolean;
  duration: number;
  timestamp: Date;
}

export default interface ITraining {
  record(training: ITrainingRecording): void;
}
