module.exports = async function(notion) {
  console.log(
    Object.getOwnPropertyNames(notion).concat(
      Object.getOwnPropertyNames(Object.getPrototypeOf(notion))
    )
  );

  await notion.disconnect();
};
