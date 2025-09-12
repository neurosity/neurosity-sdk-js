import { Neurosity } from "../../src/index";

export default async function ({
  email,
  password
}: {
  email: string;
  password: string;
}) {
  const neurosity = new Neurosity();

  await neurosity.login({
    email: email,
    password: password
  });

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
}
