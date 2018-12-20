import { Notion } from "../Notion";
import WebsocketClient from "../api/websocket";
import { IInternalContext, IExternalContext } from "./context.d";

// Do not export, this is used to identify skills at runtime
const token = Symbol();

export function createSkill(app: Function) {
  function connect(internalContext: IInternalContext): Function {
    const { deviceId, socketUrl, skill } = internalContext;
    const { metrics: metricsAllowed } = skill;

    const websocket = new WebsocketClient({
      socketUrl
    });

    const notion = new Notion({
      deviceId,
      metricsAllowed,
      websocket
    });

    return function run(): Function {
      const externalContext: IExternalContext = { skill };
      return app(notion, externalContext);
    };
  }

  // The `connect` function is the value that javascript modules
  // exporting `createSkill(...)` will have access to. To identify what
  // a skill is at runtime, we need a way to "tag it" with a token
  connect[token] = true;

  return connect;
}

export function isSkill(connect: Function): boolean {
  return (
    typeof connect === "function" &&
    Object.getOwnPropertySymbols(connect).includes(token)
  );
}
