module.exports = async function(notion) {
  notion.features().subscribe(features => {
    console.log("features", features);
  });

  await notion.toggleFeature("lsl");
  await notion.toggleFeature("simulate");
  await notion.toggleFeature("lsl");
};
