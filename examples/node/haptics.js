module.exports = async function(notion) {
  const info = await notion.getInfo();
  console.log("info", info);

  const hapticCodes = notion.getHapticCodes();

  const hapticOptions = {
    P7: [
      hapticCodes.tripleClick100
    ],
    P8: ["tripleClick100"]
  };

  const res = await notion.haptics(hapticOptions);
  console.log("Res", res);
};
  