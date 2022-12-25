module.exports = async function (neurosity) {
  neurosity.calm().subscribe((calm) => {
    console.log("calm", calm);
  });
};
