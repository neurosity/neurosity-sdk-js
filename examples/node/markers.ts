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

  let count = 0;

  neurosity.brainwaves("raw").subscribe((brainwaves) => {
    // @ts-expect-error - TODO: export types from @neurosity/pipes
    if (brainwaves?.info?.markers?.length > 0) {
      // @ts-expect-error - TODO: export types from @neurosity/pipes
      console.log("Got a marker!", brainwaves.info.markers);
    }
  });

  setTimeout(() => {
    setInterval(() => {
      neurosity.addMarker(`my-marker-${count}`).catch((error) => {
        console.log(error);
      });
      count++;
    }, 100);
  }, 5000);
}
