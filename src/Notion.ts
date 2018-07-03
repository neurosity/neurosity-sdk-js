import { Observable } from "rxjs";
import ApiClient from "./api/index";
import IOptions from "./options.i";
import INotion from "./notion.i";

const defaultOptions = {
  cloud: false,
  autoConnect: true
};

export class Notion extends ApiClient implements INotion {
  constructor(options?: IOptions) {
    if (!options.deviceId) {
      throw new Error("Notion: deviceId is mandatory");
    }
    super({
      ...defaultOptions,
      ...options
    });
  }

  protected getMetric(metric, ...labels) {
    this.metrics.subscribe(metric, ...labels);

    return new Observable(observer => {
      this.metrics.on(metric, (...data) => {
        observer.next(...data);
      });
      return () => {
        this.metrics.unsubscribe(metric);
      };
    });
  }

  public acceleration(...labels) {
    return this.getMetric("acceleration", ...labels);
  }

  public awareness(...labels) {
    return this.getMetric("awareness", ...labels);
  }

  public brainwaves(...labels) {
    return this.getMetric("sample", ...labels);
  }

  public channelAnalysis(...labels) {
    return this.getMetric("channelAnalysis", ...labels);
  }

  public emotion(...labels) {
    return this.getMetric("emotion", ...labels);
  }

  public facialExpression(...labels) {
    return this.getMetric("facialExpression", ...labels);
  }

  public kinesis(...labels) {
    return this.getMetric("kinesis", ...labels);
  }

  public status(...labels) {
    return this.getMetric("status", ...labels);
  }

  public get training() {
    return {
      record: training => {
        const message = {
          fit: false,
          timestamp: Date.now(),
          ...training
        };
        this.actions.dispatch({
          command: "training",
          action: "record",
          message
        });
      }
    };
  }
}

export default Notion;
