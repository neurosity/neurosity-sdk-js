module.exports = async function (notion) {
  notion.brainwaves("powerByBand").subscribe((powerByBand) => {
    console.log("powerByBand", powerByBand);
  });

  await notion
    .enableIncognitoMode(true)
    .catch((error) => console.log(error.message));
};
