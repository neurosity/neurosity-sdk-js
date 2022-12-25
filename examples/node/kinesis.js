module.exports = async function (neurosity) {
  neurosity.kinesis("leftHandPinch").subscribe((kinesis) => {
    console.log("kinesis", kinesis);
  });
};
