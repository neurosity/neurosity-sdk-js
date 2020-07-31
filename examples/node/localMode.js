module.exports = async function (notion) {
  await notion
    .enableLocalMode(true)
    .catch((error) => console.log(error));

  notion.brainwaves("powerByBand").subscribe((powerByBand) => {
    console.log("powerByBand", powerByBand.data);
  });

  setTimeout(() => {
    notion.enableLocalMode(false);
  }, 8000);
};
