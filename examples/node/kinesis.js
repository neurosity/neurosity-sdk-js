module.exports = async function(notion) {
  notion.kinesis("leftHandPinch").subscribe(kinesis => {
    console.log("kinesis", kinesis);
  });
};
