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
