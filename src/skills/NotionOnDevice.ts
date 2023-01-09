import { Neurosity } from "../Neurosity";
import { SDKOptions } from "../types/options";
import { Skill, SkillInstance } from "../types/skill";

export type NotionOnDevice = Omit<Neurosity, "skill">;

export interface OnDeviceOptions extends SDKOptions {
  skill: Skill;
}

/**
 * @internal
 */
export async function createNotionOnDevice(
  options: OnDeviceOptions
): Promise<[NotionOnDevice, SkillInstance]> {
  const neurosity = new Neurosity(options);
  const skill = {
    ...(await neurosity.skill(options.skill.bundleId)),
    props: "props" in options.skill ? options.skill.props : {}
  };
  delete neurosity.skill;
  return [neurosity, skill];
}
