module.exports = async function (neurosity) {
  neurosity.settings().subscribe((settings) => {
    console.log("settings", settings);
  });

  await delay();
  const x = await neurosity.changeSettings({ lsl: true, simulate: true });
  await delay();
  await neurosity.changeSettings({ simulate: false });
  await delay();
  await neurosity.changeSettings({ lsl: false });
};

function delay(ms = 500) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
