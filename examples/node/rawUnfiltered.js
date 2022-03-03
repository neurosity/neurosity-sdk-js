module.exports = async function (notion) {
  // data does not get notch or band pass filters applied unlike the `raw` option
  notion.brainwaves("rawUnfiltered").subscribe((brainwaves) => {
    console.log("brainwaves", brainwaves);
  });
};
