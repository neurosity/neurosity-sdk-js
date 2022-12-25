module.exports = async function (neurosity) {
  const info = await neurosity.getInfo();
  console.log("info", info);
};
