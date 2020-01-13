import {
  createNotionOnDevice,
  OnDeviceOptions,
  NotionOnDevice
} from "./NotionOnDevice";
import { SkillInstance, SkillSubscription } from "../types/skill";

type SkillApp = (
  notion: NotionOnDevice,
  skill: SkillInstance
) => () => Promise<void>;

export function createSkill(app: SkillApp) {
  return {
    subscribe: async (
      options: OnDeviceOptions
    ): Promise<SkillSubscription> => {
      const [notion, skill] = await createNotionOnDevice({
        ...options,
        transport: "offline"
      });
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
