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

  neurosity.settings().subscribe((settings) => {
    console.log(settings);
  });

  await delay();
  await neurosity.changeSettings({ supportAccess: false });
  await delay();
  await neurosity.changeSettings({ supportAccess: true });
}

function delay(ms = 1000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
