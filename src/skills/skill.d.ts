export interface ISkill {
  id: string;
  name: string;
  description: string;
  organization?: string;
  registry: string;
  packageName: string;
  version: string;
  metrics: string[];
  rating?: number;
  userId: string;
  publishedDate: number;
  updatedDate?: number;
  status: string;
}
