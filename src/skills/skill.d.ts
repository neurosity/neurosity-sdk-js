import { Observable } from "rxjs";

type SkillProps = { [key: string]: string | number | boolean };

export interface ISkill {
  id: string;
  bundleId: string;
  spec: string;
  name: string;
  description: string;
  props?: SkillProps;
  organization?: string;
  metrics: string[];
  userId: string;
  timestamp: number;
  status: string;
  thumbnail: string;
}

export interface IDeviceSkill {
  installedDate: number;
  manifest: { [key: string]: any };
  status: string;
}

type SkillMetric = { [key: string]: any };

interface ISkillMetricNext {
  next(value: SkillMetric): void;
}

export interface ISkillInstance {
  props?: SkillProps;
  metric(metric: string): Observable<SkillMetric> | ISkillMetricNext;
}

export interface ISkillSubscription {
  unsubscribe(): void;
}

export interface ISkillsClient {
  get: (id: string) => Promise<IDeviceSkill>;
}
