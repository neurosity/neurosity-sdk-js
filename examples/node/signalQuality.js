module.exports = async function(notion) {
  notion.signalQuality().subscribe(signalQuality => {
    console.log("signalQuality", signalQuality);
  });
};
