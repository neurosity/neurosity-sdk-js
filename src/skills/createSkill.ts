import { Notion } from "../Notion";
import WebsocketClient from "../api/websocket";
import { IInternalContext, IExternalContext } from "./context.d";

export function createSkill(app: Function) {
  return function connect(internalContext: IInternalContext): Function {
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
  };
}
