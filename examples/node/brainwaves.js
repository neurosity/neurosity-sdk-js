module.exports = async function (neurosity) {
  neurosity.brainwaves("raw", "powerByBand").subscribe((brainwaves) => {
    console.log("brainwaves", brainwaves);
  });
};
