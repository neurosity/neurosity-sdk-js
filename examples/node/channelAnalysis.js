module.exports = async function(notion) {
  notion.channelAnalysis().subscribe(channelAnalysis => {
    console.log("channelAnalysis", channelAnalysis);
  });
};
