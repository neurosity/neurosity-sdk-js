const { Notion } = require("../..");

const notion = new Notion({
  deviceId: process.env.DEVICE_ID
});

notion.api.actions.dispatch({
  command: "random",
  action: "send",
  responseRequired: true,
  message: {
    value: Math.random()
  }
});
