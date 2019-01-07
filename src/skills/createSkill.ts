import { Notion } from "../Notion";
import WebsocketClient from "../api/websocket";
import { ISkillInstance, ISkillSubscription } from "../skills/skill.d";
import { IContext } from "./context.d";

type ISkillApp = (
  notion: Notion,
  skill: ISkillInstance
) => () => Promise<void>;

export function createSkill(app: ISkillApp) {
  return {
    subscribe: (context: IContext): ISkillSubscription => {
      const { deviceId, socketUrl, skill: skillData } = context;
      const { metrics: metricsAllowed } = skillData;

      const notion = new Notion({
        deviceId,
        metricsAllowed,
        websocket: new WebsocketClient({
          deviceId,
          socketUrl
        })
      });

      const skill = notion.skill(skillData.id);

      const teardown = app(notion, skill);

      return {
        unsubscribe: async () => {
          await notion.disconnect();
          await (teardown() || (() => Promise.resolve()));
        }
      };
    }
  };
}
