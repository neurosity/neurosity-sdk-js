import { Notion } from "../Notion";
import WebsocketClient from "../api/websocket";
import { IInternalContext, IExternalContext } from "./context.d";

export const SKILL_TOKEN = Symbol();

export function createSkill(app: Function) {
  function connect(internalContext: IInternalContext): Function {
    const { deviceId, socketUrl, skill } = internalContext;
    const { metrics: metricsAllowed } = skill;

    return function run(): Function {
      const notion = new Notion({
        deviceId,
        metricsAllowed,
        websocket: new WebsocketClient({
          socketUrl
        })
      });

      const externalContext: IExternalContext = { skill };

      return app(notion, externalContext);
    };
  }

  // The `connect` function is the value that javascript modules
  // exporting `createSkill(...)` will have access to. To identify what
  // a skill is at runtime, we need a way to "tag it" with a token
  connect[SKILL_TOKEN] = true;

  return connect;
}
