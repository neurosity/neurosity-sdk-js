import { Notion } from "./Notion";
import IOptions from "./options.d";
import { ISkill, ISkillInstance } from "./skills/skill.d";
import INotion from "./notion";

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export interface IOnDeviceOptions extends IOptions {
  onDeviceSocketUrl: string;
  skill: ISkill;
}

export interface INotionOnDevice extends Omit<INotion, "skill"> {}

export async function createNotionOnDevice(
  options: IOnDeviceOptions
): Promise<[INotionOnDevice, ISkillInstance]> {
  const notion = new Notion(options);
  const skill = await notion.skill(options.skill.id);
  delete notion.skill;
  return [notion, skill];
}
