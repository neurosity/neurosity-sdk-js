module.exports = async function (notion) {
  await notion
    .enableIncognitoMode(true)
    .catch((error) => console.log(error.message));

  notion.brainwaves("powerByBand").subscribe((powerByBand) => {
    console.log("powerByBand", powerByBand.data);
  });
};
