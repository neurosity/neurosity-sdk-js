module.exports = async function (neurosity) {
  const info = await neurosity.getInfo();
  console.log("info", info);

  const effects = neurosity.getHapticEffects();
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

  const res = await neurosity.haptics(hapticOptions);
  console.log("Res", res);
};
