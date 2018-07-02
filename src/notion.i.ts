import { Observable } from "rxjs";
import ITraining from "./training.i";

export default interface INotion {
  getInfo(): Promise<any>;
  awareness(...labels: string[]): Observable<any>;
  brainwaves(...labels: string[]): Observable<any>;
  status(...labels: string[]): Observable<any>;
  emotion(...labels: string[]): Observable<any>;
  kinesis(...labels: string[]): Observable<any>;
  facialExpression(...labels: string[]): Observable<any>;
  channelAnalysis(...labels: string[]): Observable<any>;
  acceleration(...labels: string[]): Observable<any>;
  training: ITraining;
}
