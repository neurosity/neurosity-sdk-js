import { Neurosity } from "../../src/index";

export default async function ({ apiKey }: { apiKey: string }) {
  const neurosity = new Neurosity();

  neurosity.onUserClaimsChange().subscribe((userClaims) => {
    console.log("userClaims", userClaims);
  });

  await neurosity.login({
    apiKey: apiKey
  });

  neurosity.status().subscribe((status) => {
    console.log("status", status);
  });

  neurosity.calm().subscribe((calm) => {
    console.log("calm", calm);
  });
}
