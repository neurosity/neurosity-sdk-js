import { Observable, throwError } from "rxjs";
import { map } from "rxjs/operators";
import { metrics } from "@neurosity/ipk";
import ApiClient from "./api/index";
import IOptions from "./options.d";
import INotion from "./notion.d";
import ISubscription from "./subscription.d";
import { pick } from "./utils/pick";

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
  protected getMetric = (subscription: ISubscription) => {
    const { metric, labels, group } = subscription;

    if (hasInvalidLabels(metric, labels)) {
      const validLabels = getMetricLabels(metric).join(", ");
      return throwError(
        new Error(
          `One ore more labels provided to ${metric} are invalid. The valid labels for ${metric} are ${validLabels}`
        )
      );
    }

    return new Observable(observer => {
      const withDefaultLabels = labels.length
        ? labels
        : getMetricLabels(metric);

      const subscriptionId = this.metrics.subscribe({
        metric: metric,
        labels: withDefaultLabels,
        group: group
      });

      this.metrics.on(subscriptionId, (...data) => {
        observer.next(...data);
      });

      return () => {
        this.metrics.unsubscribe(subscriptionId);
      };
    });
  };

  /**
   * @param labels Name of metric properties to filter by
   * @returns Observable of acceleration metric events
   */
  public acceleration(...labels) {
    return this.getMetric({
      metric: "acceleration",
      labels: labels,
      group: true
    });
  }

  /**
   * @param labels Name of metric properties to filter by
   * @returns Observable of awareness metric events
   */
  public awareness(...labels) {
    return this.getMetric({
      metric: "awareness",
      labels: labels,
      group: false
    });
  }

  /**
   * @param labels Name of metric properties to filter by
   * @returns Observable of brainwaves metric events
   */
  public brainwaves(...labels) {
    return this.getMetric({
      metric: "brainwaves",
      labels: labels,
      group: true
    });
  }

  /**
   * @param labels Name of metric properties to filter by
   * @returns Observable of channelAnalysis metric events
   */
  public channelAnalysis(...labels) {
    return this.getMetric({
      metric: "channelAnalysis",
      labels: labels,
      group: true
    });
  }

  /**
   * @param labels Name of metric properties to filter by
   * @returns Observable of emotion metric events
   */
  public emotion(...labels) {
    return this.getMetric({
      metric: "emotion",
      labels: labels,
      group: false
    });
  }

  /**
   * @param labels Name of metric properties to filter by
   * @returns Observable of facialExpression metric events
   */
  public facialExpression(...labels) {
    return this.getMetric({
      metric: "facialExpression",
      labels: labels,
      group: false
    });
  }

  /**
   * @param labels Name of metric properties to filter by
   * @returns Observable of kinesis metric events
   */
  public kinesis(...labels) {
    return this.getMetric({
      metric: "kinesis",
      labels: labels,
      group: false
    });
  }

  /**
   * Emits last state of status and all subsequent status changes
   *
   * @param labels Name of metric properties to filter by
   * @returns Observable of status metric events
   */
  public status(...labels) {
    if (hasInvalidLabels("status", labels)) {
      const validLabels = getMetricLabels("status").join(", ");
      return throwError(
        new Error(
          `One ore more labels provided to status are invalid. Valid labels are ${validLabels}`
        )
      );
    }

    const withDefaultLabels = labels.length
      ? labels
      : getMetricLabels("status");

    const status = new Observable(observer => {
      this.onStatus((...data) => {
        observer.next(...data);
      });

      return () => {};
    });

    return status.pipe(map(status => pick(status, withDefaultLabels)));
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
