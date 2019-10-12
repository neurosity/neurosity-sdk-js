module.exports = async function(notion) {
  notion.brainwaves("raw", "powerByBand").subscribe(brainwaves => {
    console.log("brainwaves", brainwaves);
  });
};
