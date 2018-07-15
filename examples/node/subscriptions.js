const { Notion } = require("../..");

const notion = new Notion({
  cloud: true,
  deviceId: "df7a02157bfa623941d229984525246f"
});

const channelAnalysis = notion
  .channelAnalysis("FC1", "FC2")
  .subscribe(channelAnalysis => {
    console.log("channelAnalysis", channelAnalysis);
  });

notion
  .channelAnalysis()
  .subscribe(channelAnalysis => {
    console.log("channelAnalysis2", channelAnalysis);
  });

const acceleration = notion
  .acceleration()
  .subscribe(acceleration => {
    console.log("acceleration", acceleration);
  });

console.log("subscribed to channelAnalysis");
console.log("subscribed to channelAnalysis2");
console.log("subscribed to acceleration");

setTimeout(() => {
  notion
    .channelAnalysis("FC2", "CP1", "CP2", "CP3")
    .subscribe(channelAnalysis => {
      console.log("channelAnalysis3", channelAnalysis);
    });

  console.log("subscribed to channelAnalysis3");
  
  channelAnalysis.unsubscribe();
  console.log("unsubscribed from channelAnalysis");

}, 8000);
