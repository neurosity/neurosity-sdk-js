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
    .removeApiKey("M4aJkx28KasrX6FLj7SP")
    .then((response) => {
      console.log("success", response);
    })
    .catch((error) => {
      console.log(error);
    });
}
