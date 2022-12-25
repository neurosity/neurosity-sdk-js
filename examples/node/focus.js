module.exports = async function (neurosity) {
  neurosity.focus().subscribe((focus) => {
    console.log("focus", focus);
  });
};
