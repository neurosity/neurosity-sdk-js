module.exports = async function (neurosity) {
  neurosity
    .predictions("leftHandPinch", "jumpingJacks")
    .subscribe((prediction) => {
      console.log("prediction", prediction);
    });
};
