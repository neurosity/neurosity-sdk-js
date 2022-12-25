module.exports = async function (neurosity) {
  neurosity.dispatchAction({
    command: "random",
    action: "send",
    responseRequired: true,
    message: {
      value: Math.random()
    }
  });
};
