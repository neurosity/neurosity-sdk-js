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

  neurosity.brainwaves("raw").subscribe((brainwaves) => {
    console.log("brainwaves", brainwaves);
  });
}
