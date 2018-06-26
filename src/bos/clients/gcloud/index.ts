import PubSub from "@google-cloud/pubsub";
import { defaultConfig, configProps } from "./config";

export default class GCloudClient {

  pubsubClient;

  constructor(options) {
    this.pubsubClient = new PubSub({
      ...defaultConfig,
      ...options
    });
  }

  public onMetric(metric, callback) {

  }

  public onStatusChange(callback) {

  }

  public subscribe(metric, ...props) {
    
  }

  public unsubscribe(metric) {
    
  }

  public async connect() {
    await {};
  }

  public async disconnect() {
    await {};
  }
}
