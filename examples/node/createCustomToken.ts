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
    .createCustomToken()
    .then((token) => {
      console.log("success", token);
    })
    .catch((error) => {
      console.log(error);
    });
}
