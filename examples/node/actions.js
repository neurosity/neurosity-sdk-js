const { Notion } = require("../..");

const notion = new Notion({
  deviceId: process.env.DEVICE_ID
});

(async () => {
  const noResponse = await notion.actions.dispatch({
    command: "actions",
    action: "test",
    message: {
      order: 1
    }
  });

  console.log("noResponse", noResponse);
})();

(async () => {
  const response = await notion.actions.dispatch({
    command: "actions",
    action: "test",
    responseRequired: true,
    message: {
      order: 2
    }
  });

  console.log("response", response);
})();
