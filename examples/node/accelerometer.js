module.exports = async function(notion) {
  notion.accelerometer().subscribe(accelerometer => {
    console.log("accelerometer", accelerometer);
  });
};
