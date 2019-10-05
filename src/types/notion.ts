import { Observable } from "rxjs";
import { ITraining } from "./training";
import { ISkillInstance } from "./skill";

export default interface INotion {
  addMarker(label: string): void;
  awareness(label: string, ...otherLabels: string[]): Observable<any>;
  brainwaves(label: string, ...otherLabels: string[]): Observable<any>;
  calm(): Observable<any>;
  channelAnalysis(): Observable<any>;
  emotion(label: string, ...otherLabels: string[]): Observable<any>;
  getInfo(): Promise<any>;
  kinesis(label: string, ...otherLabels: string[]): Observable<any>;
  predictions(label: string, ...otherLabels: string[]): Observable<any>;
  signalQuality(): Observable<any>;
  status(): Observable<any>;
  skill(id: string): Promise<ISkillInstance>;
  training: ITraining;
  disconnect(): Promise<any>;
}
