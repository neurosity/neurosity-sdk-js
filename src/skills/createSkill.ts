import { Notion } from "../Notion";

// Do not export, this is used to identify skills at runtime
const token = Symbol();

export function createSkill(app) {
  function connect(context) {
    const { deviceId, skill } = context;
    const { metrics } = skill;

    const notion = new Notion({
      deviceId,
      metricsAllowed: metrics
    });

    return function run() {
      return app(notion, context);
    };
  }

  // The `connect` function is the value that javascript modules
  // exporting `createSkill(...)` will have access to. To identify what
  // a skill is at runtime, we need a way to "tag it" with a token
  connect[token] = true;

  return connect;
}

export function isSkill(connect) {
  return (
    typeof connect === "function" &&
    Object.getOwnPropertySymbols(connect).includes(token)
  );
}
