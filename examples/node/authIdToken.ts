import { Neurosity } from "../../src/index";

export default async function ({
  idToken,
  providerId
}: {
  idToken: string;
  providerId: string;
}) {
  const neurosity = new Neurosity();

  await neurosity.login({
    idToken,
    providerId
  });

  neurosity.status().subscribe((status) => {
    console.log("status", status);
  });
}
