module.exports = async function(notion) {
  notion.focus().subscribe(focus => {
    console.log("focus", focus);
  });
};
