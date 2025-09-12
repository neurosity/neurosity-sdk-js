import { Neurosity } from "../../src/index";

export default async function ({ customToken }: { customToken: string }) {
  const neurosity = new Neurosity();

  await neurosity.login({
    customToken: customToken
  });

  neurosity.status().subscribe((status) => {
    console.log("status", status);
  });
}
