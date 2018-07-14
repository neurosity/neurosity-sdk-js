import { Observable, throwError } from "rxjs";
import { metrics } from "@neurosity/ipk";
import ApiClient from "./api/index";
import IOptions from "./options.i";
import INotion from "./notion.i";

const defaultOptions = {
  cloud: false,
  autoConnect: true
};

const getMetricLabels = metric => Object.keys(metrics[metric]);

const hasInvalidLabels = (metric, labels) => {
  const validLabels = getMetricLabels(metric);
  return !labels.every(label => validLabels.includes(label));
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
    if (hasInvalidLabels(metric, labels)) {
      const validLabels = getMetricLabels(metric).join(", ");
      return throwError(
        new Error(
          `One ore more labels provided to ${metric} are invalid. The valid labels for ${metric} are ${validLabels}`
        )
      );
    }

    return new Observable(observer => {
      if (!labels.length) {
        labels = getMetricLabels(metric);
      }

      const subscriptionIds = labels.map(label =>
        this.metrics.subscribe(metric, label)
      );

      subscriptionIds.forEach(subscriptionId => {
        this.metrics.on(subscriptionId, (...data) => {
          observer.next(...data);
        });
      });

      return () => {
        subscriptionIds.forEach(subscriptionId => {
          this.metrics.unsubscribe(subscriptionId);
        });
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
          baseline: false,
          ...training,
          timestamp: this.timestamp
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
