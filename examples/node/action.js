module.exports = async function(notion) {
  notion.api.actions.dispatch({
    command: "random",
    action: "send",
    responseRequired: true,
    message: {
      value: Math.random()
    }
  });
};
