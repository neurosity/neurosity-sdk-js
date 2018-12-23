import { Observable, throwError } from "rxjs";
import { map } from "rxjs/operators";
import { metrics } from "@neurosity/ipk";
import ApiClient from "./api/index";
import IOptions from "./options.d";
import INotion from "./notion.d";
import ISubscription from "./subscription.d";
import { getMetricLabels, validateMetric } from "./utils/metric";
import { pick } from "./utils/pick";

const defaultOptions = {
  metricsAllowed: Object.keys(metrics),
  websocket: null
};

/**
 *
 */
export class Notion extends ApiClient implements INotion {
  /**
   * @hidden
   */
  protected options: IOptions;

  constructor(customOptions: IOptions) {
    super({
      ...defaultOptions,
      ...customOptions
    });

    if (!this.options.deviceId) {
      throw new Error("Notion: deviceId is mandatory");
    }
  }

  /**
   * @hidden
   */
  protected getMetric = (
    subscription: ISubscription
  ): Observable<any> => {
    const { metric, labels, group } = subscription;

    const error = validateMetric(metric, labels, this.options);
    if (error) {
      return throwError(error);
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
  public acceleration(...labels): Observable<any> {
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
  public awareness(...labels): Observable<any> {
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
  public brainwaves(...labels): Observable<any> {
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
  public channelAnalysis(...labels): Observable<any> {
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
  public emotion(...labels): Observable<any> {
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
  public facialExpression(...labels): Observable<any> {
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
  public kinesis(...labels): Observable<any> {
    return this.getMetric({
      metric: "kinesis",
      labels: labels,
      group: false
    });
  }

  /**
   * @param labels Name of metric properties to filter by
   * @returns Observable of predictions metric events
   */
  public predictions(...labels): Observable<any> {
    return this.getMetric({
      metric: "predictions",
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
  public status(...labels): Observable<any> {
    const error = validateMetric("status", labels, this.options);
    if (error) {
      return throwError(error);
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

  /**
   * @returns Skill
   */
  public skill(id) {
    const command = "skills";
    return {
      install: async (): Promise<any> => {
        this.actions.dispatch({
          command,
          action: "install",
          message: { id }
        });
        return Promise.resolve();
      },
      uninstall: async (): Promise<any> => {
        this.actions.dispatch({
          command,
          action: "uninstall",
          message: { id }
        });
        return Promise.resolve();
      }
    };
  }
}

export default Notion;
