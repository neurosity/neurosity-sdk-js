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

  neurosity.signalQuality().subscribe((signalQuality) => {
    console.log("signalQuality", signalQuality);
  });
}
