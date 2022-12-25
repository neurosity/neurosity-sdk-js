module.exports = async function (neurosity) {
  const info = await neurosity.getInfo();
  console.log("info", info);

  const trainingOptions = {
    metric: "kinesis",
    label: "leftHandPinch",
    experimentId: "-experiment-123"
  };

  // Show metric and label message to user now
  let message = "imagine left hand pinch";
  setTimeout(neurosity.training.record, 3500, trainingOptions);
  setTimeout(neurosity.training.record, 3700, trainingOptions);
  setTimeout(neurosity.training.record, 4000, trainingOptions);

  // Show baseline message in 5 seconds from now
  setTimeout(() => {
    message = "relax and clear your mind";
  }, 5000);

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
};
