module.exports = async function (neurosity) {
  neurosity.accelerometer().subscribe((accelerometer) => {
    console.log("accelerometer", accelerometer);
  });
};
