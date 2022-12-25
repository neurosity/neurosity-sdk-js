module.exports = async function (neurosity) {
  const akimy = await neurosity.skill("app.neurosity.akimy");

  akimy.metric("fromDevice").subscribe((data) => {
    console.log("fromDevice", data);
  });

  setInterval(() => {
    akimy.metric("fromDevice").next({
      hello: Date.now()
    });
  }, 2000);
};
