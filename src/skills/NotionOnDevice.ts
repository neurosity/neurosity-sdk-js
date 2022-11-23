import { Notion } from "../Notion";
import { SDKOptions } from "../types/options";
import { Skill, SkillInstance } from "../types/skill";

export type NotionOnDevice = Omit<Notion, "skill">;

export interface OnDeviceOptions extends SDKOptions {
  skill: Skill;
}

/**
 * @internal
 */
export async function createNotionOnDevice(
  options: OnDeviceOptions
): Promise<[NotionOnDevice, SkillInstance]> {
  const notion = new Notion(options);
  const skill = {
    ...(await notion.skill(options.skill.bundleId)),
    props: "props" in options.skill ? options.skill.props : {}
  };
  delete notion.skill;
  return [notion, skill];
}
