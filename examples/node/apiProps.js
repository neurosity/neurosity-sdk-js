module.exports = async function (neurosity) {
  console.log(
    Object.getOwnPropertyNames(neurosity).concat(
      Object.getOwnPropertyNames(Object.getPrototypeOf(neurosity))
    )
  );

  await neurosity.disconnect();
};
