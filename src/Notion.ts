import { Observable } from "rxjs";
import ApiClient from "./api/index";
import IOptions from "./options.i";
import INotion from "./notion.i";

const defaultOptions = {
  cloud: false,
  autoConnect: true
};

/**
 * 
 */
export class Notion extends ApiClient implements INotion {
  constructor(options?: IOptions) {
    super({
      ...defaultOptions,
      ...options
    });
    if (!options.deviceId) {
      throw new Error("Notion: deviceId is mandatory");
    }
  }

  /**
   * @hidden
   */
  protected getMetric = (metric, ...labels) => {
    this.metrics.subscribe(metric, ...labels);

    return new Observable(observer => {
      this.metrics.on(metric, (...data) => {
        observer.next(...data);
      });
      return () => {
        this.metrics.unsubscribe(metric);
      };
    });
  };

  /**
   * @param labels  Name of metric properties to filter by
   * @returns Observable of acceleration metric events
   */
  public acceleration(...labels) {
    return this.getMetric("acceleration", ...labels);
  }

  /**
   * @param labels  Name of metric properties to filter by
   * @returns Observable of awareness metric events
   */
  public awareness(...labels) {
    return this.getMetric("awareness", ...labels);
  }

  /**
   * @param labels  Name of metric properties to filter by
   * @returns Observable of brainwaves metric events
   */
  public brainwaves(...labels) {
    return this.getMetric("brainwaves", ...labels);
  }

  /**
   * @param labels  Name of metric properties to filter by
   * @returns Observable of channelAnalysis metric events
   */
  public channelAnalysis(...labels) {
    return this.getMetric("channelAnalysis", ...labels);
  }

  /**
   * @param labels  Name of metric properties to filter by
   * @returns Observable of emotion metric events
   */
  public emotion(...labels) {
    return this.getMetric("emotion", ...labels);
  }

  /**
   * @param labels  Name of metric properties to filter by
   * @returns Observable of facialExpression metric events
   */
  public facialExpression(...labels) {
    return this.getMetric("facialExpression", ...labels);
  }

  /**
   * @param labels  Name of metric properties to filter by
   * @returns Observable of kinesis metric events
   */
  public kinesis(...labels) {
    return this.getMetric("kinesis", ...labels);
  }

  /**
   * @param labels  Name of metric properties to filter by
   * @returns Observable of status metric events
   */
  public status(...labels) {
    return this.getMetric("status", ...labels);
  }

  /**
   * @returns Training methods
   */
  public get training() {
    return {
      record: training => {
        const message = {
          fit: false,
          timestamp: this.timestamp,
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
