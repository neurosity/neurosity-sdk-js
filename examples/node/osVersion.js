module.exports = async function (neurosity) {
  neurosity.osVersion().subscribe((osVersion) => {
    console.log("osVersion", osVersion);
  });
};
