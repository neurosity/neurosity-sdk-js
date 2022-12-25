module.exports = async function (neurosity) {
  neurosity.signalQuality().subscribe((signalQuality) => {
    console.log("signalQuality", signalQuality);
  });
};
