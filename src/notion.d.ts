import { Observable } from "rxjs";
import { ITraining } from "./training.d";
import { ISkillInstance } from "./skills/skill.d";

export default interface INotion {
  awareness(...labels: string[]): Observable<any>;
  brainwaves(...labels: string[]): Observable<any>;
  channelAnalysis(): Observable<any>;
  emotion(...labels: string[]): Observable<any>;
  getInfo(): Promise<any>;
  kinesis(...labels: string[]): Observable<any>;
  predictions(...labels: string[]): Observable<any>;
  signalQuality(): Observable<any>;
  status(): Observable<any>;
  skill(id: string): Promise<ISkillInstance>;
  training: ITraining;
  disconnect(): Promise<any>;
}
