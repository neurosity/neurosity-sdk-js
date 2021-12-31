module.exports = async function (notion) {
  const info = await notion.getInfo();
  console.log("info", info);

  const effects = notion.hapticEffects;
  const hapticOptions = {
    P7: [effects.strongClick100],
    P8: [
      effects.transitionRampUpLongSmooth1_0_to_100,
      effects.transitionRampDownLongSmooth1_100_to_0,
      effects.transitionRampUpLongSmooth1_0_to_100,
      effects.transitionRampDownLongSmooth1_100_to_0,
      effects.transitionRampUpLongSmooth1_0_to_100,
      effects.transitionRampDownLongSmooth1_100_to_0
    ]
  };

  const res = await notion.haptics(hapticOptions);
  console.log("Res", res);
};
