module.exports = async function(notion) {
  notion.calm().subscribe(calm => {
    console.log("calm", calm);
  });
};
