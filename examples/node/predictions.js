module.exports = async function(notion) {
  notion
    .predictions("leftHandPinch", "jumpingJacks")
    .subscribe(prediction => {
      console.log("prediction", prediction);
    });
};
