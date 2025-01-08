import { Observable } from "rxjs";

/**
 * @hidden
 */
type SkillProps = Record<string, string | number | boolean>;

/**
 * @hidden
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
 * @hidden
 */
export interface DeviceSkill {
  id: string;
  bundleId: string;
  installedDate: number;
  manifest: Record<string, unknown>;
  status: string;
}

/**
 * @hidden
 */
type SkillMetric = Record<string, unknown>;

/**
 * @hidden
 */
interface SkillMetricNext {
  next(value: SkillMetric): void;
}

/**
 * @hidden
 */
export interface SkillInstance {
  props?: SkillProps;
  metric(metric: string): Observable<SkillMetric> | SkillMetricNext;
}

/**
 * @hidden
 */
export interface SkillSubscription {
  unsubscribe(): void;
}

/**
 * @hidden
 */
export interface SkillsClient {
  get: (id: string) => Promise<DeviceSkill>;
}
