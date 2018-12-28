import { Notion } from "../Notion";
import WebsocketClient from "../api/websocket";
import { IInternalContext, IExternalContext } from "./context.d";

type ISkillApp = (
  notion: Notion,
  context: IExternalContext
) => () => Promise<void>;

interface ISkillSubscription {
  unsubscribe(): void;
}

export function createSkill(app: ISkillApp) {
  return {
    subscribe: (
      internalContext: IInternalContext
    ): ISkillSubscription => {
      const { deviceId, socketUrl, skill } = internalContext;
      const { metrics: metricsAllowed } = skill;

      const notion = new Notion({
        deviceId,
        metricsAllowed,
        websocket: new WebsocketClient({
          deviceId,
          socketUrl
        })
      });

      const externalContext: IExternalContext = { skill };
      const teardown = app(notion, externalContext);

      return {
        unsubscribe: async () => {
          await notion.disconnect();
          await (teardown() || (() => Promise.resolve()));
        }
      };
    }
  };
}
