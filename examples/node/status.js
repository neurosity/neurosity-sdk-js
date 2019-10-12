module.exports = async function(notion) {
  notion.status().subscribe(status => {
    console.log("status", status);
  });
};
