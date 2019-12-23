import { Observable } from "rxjs";

type SkillProps = { [key: string]: string | number | boolean };

/**
 * @internal
 */
export interface Skill {
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

/**
 * @internal
 */
export interface DeviceSkill {
  id: string;
  bundleId: string;
  installedDate: number;
  manifest: { [key: string]: any };
  status: string;
}

type SkillMetric = { [key: string]: any };

/**
 * @internal
 */
interface SkillMetricNext {
  next(value: SkillMetric): void;
}

/**
 * @internal
 */
export interface SkillInstance {
  props?: SkillProps;
  metric(metric: string): Observable<SkillMetric> | SkillMetricNext;
}

/**
 * @internal
 */
export interface SkillSubscription {
  unsubscribe(): void;
}

/**
 * @internal
 */
export interface SkillsClient {
  get: (id: string) => Promise<DeviceSkill>;
}
