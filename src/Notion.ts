import { Observable, throwError } from "rxjs";
import { map } from "rxjs/operators";
import ApiClient from "./api/index";
import IOptions from "./options.d";
import INotion from "./notion.d";
import ISubscription from "./subscription.d";
import { getLabels, validate } from "./utils/subscription";
import { ISkillInstance } from "./skills/skill.d";

/**
 *
 */
export class Notion implements INotion {
  /**
   * @hidden
   */
  protected options: IOptions;
  /**
   * @hidden
   */
  protected api: ApiClient;

  constructor(options: IOptions) {
    this.options = Object.freeze(options);
    this.api = new ApiClient(this.options);

    if (!this.options.deviceId) {
      throw new Error("Notion: deviceId is mandatory");
    }
  }

  public async getInfo() {
    return await this.api.getInfo();
  }

  public async disconnect() {
    return await this.api.disconnect();
  }

  /**
   * @hidden
   */
  protected getMetric = (
    subscription: ISubscription
  ): Observable<any> => {
    const { metric, labels, atomic } = subscription;

    const error = validate(metric, labels, this.options);
    if (error) {
      return throwError(error);
    }

    return new Observable(observer => {
      const subscriptions: ISubscription[] = atomic
        ? [
            this.api.metrics.subscribe({
              metric: metric,
              labels: labels,
              atomic: atomic
            })
          ]
        : labels.map(label => {
            return this.api.metrics.subscribe({
              metric: metric,
              labels: [label],
              atomic: atomic
            });
          });

      const subscriptionWithListeners = subscriptions.map(
        subscription => ({
          subscription,
          listener: this.api.metrics.on(
            subscription,
            (...data: any) => {
              observer.next(...data);
            }
          )
        })
      );

      return () => {
        subscriptionWithListeners.forEach(
          ({ subscription, listener }) => {
            this.api.metrics.unsubscribe(subscription, listener);
          }
        );
      };
    });
  };

  /**
   * @param labels Name of metric properties to filter by
   * @returns Observable of awareness metric events
   */
  public awareness(
    label: string,
    ...otherLabels: string[]
  ): Observable<any> {
    return this.getMetric({
      metric: "awareness",
      labels: label ? [label, ...otherLabels] : [],
      atomic: false
    });
  }

  /**
   * @param labels Name of metric properties to filter by
   * @returns Observable of brainwaves metric events
   */
  public brainwaves(
    label: string,
    ...otherLabels: string[]
  ): Observable<any> {
    return this.getMetric({
      metric: "brainwaves",
      labels: label ? [label, ...otherLabels] : [],
      atomic: false
    });
  }

  /**
   * @param labels Name of metric properties to filter by
   * @returns Observable of channelAnalysis metric events
   */
  public channelAnalysis(): Observable<any> {
    const metric = "channelAnalysis";
    return this.getMetric({
      metric,
      labels: getLabels(metric),
      atomic: true
    });
  }

  /**
   * @returns Observable of signalQuality metric events
   */
  public signalQuality(): Observable<any> {
    const metric = "signalQuality";
    return this.getMetric({
      metric,
      labels: getLabels(metric),
      atomic: true
    });
  }

  /**
   * @returns Observable of emotion metric events
   */
  public emotion(
    label: string,
    ...otherLabels: string[]
  ): Observable<any> {
    return this.getMetric({
      metric: "emotion",
      labels: label ? [label, ...otherLabels] : [],
      atomic: false
    });
  }

  /**
   * @param labels Name of metric properties to filter by
   * @returns Observable of kinesis metric events
   */
  public kinesis(
    label: string,
    ...otherLabels: string[]
  ): Observable<any> {
    return this.getMetric({
      metric: "kinesis",
      labels: label ? [label, ...otherLabels] : [],
      atomic: false
    });
  }

  /**
   * @param labels Name of metric properties to filter by
   * @returns Observable of predictions metric events
   */
  public predictions(
    label: string,
    ...otherLabels: string[]
  ): Observable<any> {
    return this.getMetric({
      metric: "predictions",
      labels: label ? [label, ...otherLabels] : [],
      atomic: false
    });
  }

  /**
   * Observes last state of status and all subsequent status changes
   *
   * @returns Observable of status metric events
   */
  public status(): Observable<any> {
    return new Observable(observer => {
      const listener = this.api.onStatus(status => {
        observer.next(status);
      });

      return () => this.api.offStatus(listener);
    });
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
          timestamp: this.api.timestamp,
          ...training
        };
        this.api.actions.dispatch({
          command: "training",
          action: "record",
          message
        });
      }
    };
  }

  /**
   * Accesses a skill by Bundle ID. Additionally, allows to observe
   * and push skill metrics
   *
   * @param bundleId Bundle ID of skill
   * @returns Skill isntance
   */
  public async skill(bundleId: string): Promise<ISkillInstance> {
    const skillData = await this.api.skills.get(bundleId);

    if (skillData === null) {
      return Promise.reject(
        new Error(
          `Access denied for: ${bundleId}. Make sure the skill is installed.`
        )
      );
    }

    return {
      metric: (label: string) => {
        const metricName = `skill~${skillData.id}~${label}`;
        const subscription = new Observable(observer => {
          const subscription: ISubscription = this.api.metrics.subscribe(
            {
              metric: metricName,
              labels: [label],
              atomic: true
            }
          );

          const listener = this.api.metrics.on(
            subscription,
            (...data: any) => {
              observer.next(...data);
            }
          );

          return () => {
            this.api.metrics.unsubscribe(subscription, listener);
          };
        }).pipe(map(metric => metric[label]));

        Object.defineProperty(subscription, "next", {
          value: (metricValue: { [label: string]: any }): void => {
            this.api.metrics.next(metricName, {
              [label]: metricValue
            });
          }
        });

        return subscription;
      }
    };
  }
}

export default Notion;
