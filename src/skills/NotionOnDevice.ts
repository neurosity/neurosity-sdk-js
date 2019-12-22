import { Notion } from "../Notion";
import IOptions from "../types/options";
import { ISkill, ISkillInstance } from "../types/skill";
import INotion from "../notion";

export type INotionOnDevice = Pick<
  INotion,
  Exclude<keyof INotion, "skill">
>;

export interface IOnDeviceOptions extends IOptions {
  onDeviceSocketUrl: string;
  skill: ISkill;
}

/**
 * @internal
 */
export async function createNotionOnDevice(
  options: IOnDeviceOptions
): Promise<[INotionOnDevice, ISkillInstance]> {
  const notion = new Notion(options);
  const skill = {
    ...(await notion.skill(options.skill.bundleId)),
    props: "props" in options.skill ? options.skill.props : {}
  };
  delete notion.skill;
  return [notion, skill];
}
