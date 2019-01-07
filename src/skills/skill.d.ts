import { Observable } from "rxjs";

export interface ISkill {
  id: string;
  spec: string;
  name: string;
  description: string;
  organization?: string;
  metrics: string[];
  userId: string;
  timestamp: number;
  status: string;
}

type SkillMetric = { [key: string]: any };

interface ISkillMetricNext {
  next(value: SkillMetric): void;
}

export interface ISkillInstance {
  metric(metric: string): Observable<SkillMetric> | ISkillMetricNext;
}

export interface ISkillSubscription {
  unsubscribe(): void;
}
