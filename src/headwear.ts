import { Observable } from "rxjs";
import BosClient from "./bos/index";
import IOptions from "./options.i";

const defaultOptions = {
  cloud: false,
  autoConnect: true
};

export class Headwear extends BosClient {
  
  constructor(options?: IOptions) {
    super({
      ...defaultOptions,
      ...options
    });
  }

  public async getInfo() {
    return await {
      channels: 8,
      manufacturer: "Neurosity, Inc"
    };
  }

  private getMetric(metric, ...props) {
    this.subscribe(metric, ...props);

    return new Observable(observer => {
      this.onMetric(metric, (...data) => {
        observer.next(...data);
      });
      return () => {
        this.unsubscribe(metric);
      };
    });
  }

  public status(...props) {
    return this.getMetric("status", ...props);
  }

  public brainwaves(...props) {
    return this.getMetric("brainwaves", ...props);
  }

  public awareness(...props) {
    return this.getMetric("awareness", ...props);
  }

  public emotion(...props) {
    return this.getMetric("emotion", ...props);
  }

  public kinesis(...props) {
    return this.getMetric("kinesis", ...props);
  }

  public facialExpression(...props) {
    return this.getMetric("facialExpression", ...props);
  }

  public channelAnalysis(...props) {
    return this.getMetric("channelAnalysis", ...props);
  }

  public acceleration(...props) {
    return this.getMetric("acceleration", ...props);
  }
}

export default Headwear;
