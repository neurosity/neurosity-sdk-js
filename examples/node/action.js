module.exports = async function (notion) {
  notion.dispatchAction({
    command: "random",
    action: "send",
    responseRequired: true,
    message: {
      value: Math.random()
    }
  });
};
