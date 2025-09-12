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

  neurosity
    .createApiKey({
      description: "API Key for custom app",
      scopes: {
        "read:devices-info": true,
        "read:devices-status": true,
        "read:focus": true
      }
    })
    .then((response) => {
      console.log("success", response);
    })
    .catch((error) => {
      console.log(error);
    });
}
