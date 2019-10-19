module.exports = async function(notion) {
  notion.settings().subscribe(settings => {
    console.log("settings", settings);
  });

  await delay();
  const x = await notion.changeSettings({ lsl: true, simulate: true });
  await delay();
  await notion.changeSettings({ simulate: false });
  await delay();
  await notion.changeSettings({ lsl: false });
};

function delay(ms = 500) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
