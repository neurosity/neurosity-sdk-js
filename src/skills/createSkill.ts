import {
  createNotionOnDevice,
  IOnDeviceOptions,
  INotionOnDevice
} from "../NotionOnDevice";
import { ISkillInstance, ISkillSubscription } from "../skills/skill.d";

type ISkillApp = (
  notion: INotionOnDevice,
  skill: ISkillInstance
) => () => Promise<void>;

export function createSkill(app: ISkillApp) {
  return {
    subscribe: async (
      options: IOnDeviceOptions
    ): Promise<ISkillSubscription> => {
      const [notion, skill] = await createNotionOnDevice(options);
      const teardown = app(notion, skill);

      return {
        unsubscribe: async () => {
          await notion.disconnect();

          if (teardown && "then" in teardown) {
            const cleanUp: any = await teardown;
            if (typeof cleanUp === "function") {
              cleanUp();
            }
          }

          if (typeof teardown === "function" && "then" in teardown()) {
            return await teardown();
          }

          if (typeof teardown === "function") {
            return teardown();
          }

          return teardown;
        }
      };
    }
  };
}
