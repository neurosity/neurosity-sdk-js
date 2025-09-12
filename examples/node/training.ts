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

  const trainingOptions = {
    metric: "kinesis",
    label: "leftHandPinch",
    experimentId: "-experiment-123"
  };

  setTimeout(neurosity.training.record, 3500, trainingOptions);
  setTimeout(neurosity.training.record, 3700, trainingOptions);
  setTimeout(neurosity.training.record, 4000, trainingOptions);

  setTimeout(neurosity.training.record, 8000, {
    ...trainingOptions,
    baseline: true
  });

  setTimeout(neurosity.training.record, 8500, {
    ...trainingOptions,
    baseline: true
  });

  setTimeout(neurosity.training.record, 9000, {
    ...trainingOptions,
    fit: true,
    baseline: true
  });
}
