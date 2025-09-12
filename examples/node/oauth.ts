import { Neurosity } from "../../src/index";

export default async function ({
  email,
  password
}: {
  email: string;
  password: string;
}) {
  const neurosity = new Neurosity({
    autoSelectDevice: false
  });

  await neurosity.login({
    email: email,
    password: password
  });

  const token = await neurosity
    .getOAuthToken({
      clientId: process.env.NEUROSITY_OAUTH_CLIENT_ID!,
      clientSecret: process.env.NEUROSITY_OAUTH_CLIENT_SECRET!,
      userId: process.env.NEUROSITY_OAUTH_USER_ID!
    })
    .catch((error) => {
      console.log("oauth error", error.message);
    });

  console.log("token", token);
}
