module.exports = async function (neurosity) {
  // data does not get notch or band pass filters applied unlike the `raw` option
  neurosity.brainwaves("rawUnfiltered").subscribe((brainwaves) => {
    console.log("brainwaves", brainwaves);
  });
};
