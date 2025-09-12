import { Neurosity } from "../../src/index";

export default async function ({
  email,
  password
}: {
  email: string;
  password: string;
}) {
  const neurosity = new Neurosity({
    timesync: true
  });

  await neurosity.login({
    email: email,
    password: password
  });

  process.stdin.resume();
}
