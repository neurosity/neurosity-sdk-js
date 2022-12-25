module.exports = async function (neurosity) {
  neurosity.status().subscribe((status) => {
    console.log("status", status);
  });
};
