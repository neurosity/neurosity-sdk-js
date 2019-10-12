module.exports = async function(notion) {
  const info = await notion.getInfo();
  console.log("info", info);
};
