import { Neurosity } from "../../src/index";

export default async function ({
  email,
  password
}: {
  email: string;
  password: string;
}) {
  const client1 = new Neurosity();

  await client1.login({ email, password });

  setTimeout(async () => {
    const client2 = new Neurosity();

    await client2.login({ email, password });
  }, 2000);
}
