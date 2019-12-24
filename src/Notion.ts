import { Observable, throwError, timer } from "rxjs";
import { map } from "rxjs/operators";
import { ApiClient } from "./api/index";
import { getLabels, validate } from "./utils/subscription";
import { NotionOptions } from "./types/options";
import { Subscription } from "./types/subscription";
import { Training } from "./types/training";
import { SkillInstance } from "./types/skill";
import { Credentials } from "./types/credentials";
import { Settings, ChangeSettings } from "./types/settings";
import { AwarenessLabels } from "./types/awareness";
import { SignalQuality } from "./types/signalQuality";
import { Kinesis } from "./types/kinesis";
import { Calm } from "./types/calm";
import { Focus } from "./types/focus";
import {
  BrainwavesLabel,
  Epoch,
  PowerByBand,
  PSD
} from "./types/brainwaves";
import { DeviceInfo } from "./types/info";
import { DeviceStatus } from "./types/status";
import { Action } from "./types/actions";

/**
 * Example
 * ```typescript
 * import { Notion } from "@neurosity/notion";
 *
 * const notion = new Notion({
 *   deviceId: "..."
 * });
 * ```
 */
export class Notion {
  /**
   * @hidden
   */
  protected options: NotionOptions;
  /**
   * @hidden
   */
  protected api: ApiClient;

  /**
   * Creates new instance of Notion
   * 
   * ```typescript
   * const notion = new Notion({
   *   deviceId: "..."
   * });
   * ```

   * @param options
   */
  constructor(options: NotionOptions) {
    this.options = Object.freeze(options);
    this.api = new ApiClient(this.options);

    if (!this.options.deviceId) {
      throw new Error("Notion: deviceId is mandatory");
    }
  }

  /**
   * Starts user session
   *
   * ```typescript
   * await notion.login({
   *   email: "...",
   *   password: "..."
   * });
   * ```
   *
   * @param credentials
   */
  public async login(credentials: Credentials): Promise<void> {
    return await this.api.login(credentials);
  }

  /**
   * Ends user session
   *
   * ```typescript
   * await notion.logout();
   * // session has ended
   * ```
   *
   */
  public async logout(): Promise<void> {
    return await this.api.logout();
  }

  /**
   * @internal
   * Not user facing yet
   */
  public onAuthStateChanged(): Observable<any> {
    return this.api.onAuthStateChanged();
  }

  /**
   * ```typescript
   * const info = await notion.getInfo();
   * ```
   */
  public async getInfo(): Promise<DeviceInfo> {
    return await this.api.getInfo();
  }

  /**
   * Ends database connection
   *
   * ```typescript
   * await notion.disconnect();
   * ```
   */
  public async disconnect(): Promise<void> {
    return await this.api.disconnect();
  }

  /**
   * @internal
   * Not user facing
   */
  protected getMetric = (
    subscription: Subscription
  ): Observable<any> => {
    const { metric, labels, atomic } = subscription;

    const error = validate(metric, labels, this.options);
    if (error) {
      return throwError(error);
    }

    return new Observable(observer => {
      const subscriptions: Subscription[] = atomic
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
   * @internal
   * Not user facing
   */
  private dispatchAction(action: Action): Promise<Action> | void {
    return this.api.actions.dispatch(action);
  }

  /**
   * Injects an EEG marker to data stream
   *
   * ```typescript
   * notion.addMarker("eyes-closed");
   *
   * // later...
   *
   * notion.addMarker("eyes-open");
   * ```
   *
   * @param label Name the label to inject
   */
  public addMarker(label: string): void {
    if (!label) {
      throw new Error("Notion: a label is required for addMarker");
    }

    this.dispatchAction({
      command: "marker",
      action: "add",
      message: {
        label,
        timestamp: this.api.timestamp
      }
    });
  }

  /**
   * @internal
   *
   * @param labels Name of metric properties to filter by
   * @returns Observable of awareness metric events
   */
  public awareness(
    label: AwarenessLabels,
    ...otherLabels: AwarenessLabels[]
  ): Observable<any> {
    return this.getMetric({
      metric: "awareness",
      labels: label ? [label, ...otherLabels] : [],
      atomic: false
    });
  }

  /**
   *
   * Example
   * ```typescript
   * notion.brainwaves("raw").subscribe(brainwaves => {
   *   console.log(brainwaves);
   * });
   * ```
   *
   * Example
   * ```typescript
   * notion.brainwaves("powerByBand").subscribe(brainwaves => {
   *   console.log(brainwaves);
   * });
   * ```
   *
   * Example
   * ```typescript
   * notion.brainwaves("psd").subscribe(brainwaves => {
   *   console.log(brainwaves);
   * });
   * ```
   *
   * @param labels Name of metric properties to filter by
   * @returns Observable of brainwaves metric events
   */
  public brainwaves(
    label: BrainwavesLabel,
    ...otherLabels: BrainwavesLabel[]
  ): Observable<Epoch | PowerByBand | PSD> {
    return this.getMetric({
      metric: "brainwaves",
      labels: label ? [label, ...otherLabels] : [],
      atomic: false
    });
  }

  /**
   * Example
   * ```typescript
   * notion.calm().subscribe(calm => {
   *   console.log(calm.probability);
   * });
   *
   * // 0.45
   * // 0.47
   * // 0.53
   * // 0.51
   * // ...
   * ```
   *
   * @returns Observable of calm events - awareness/calm alias
   */
  public calm(): Observable<Calm> {
    return this.awareness("calm");
  }

  /**
   * Observes signal quality data where each property is the name
   * of the channel and the value includes the standard deviation and
   * a status set by the device
   *
   * ```typescript
   * notion.signalQuality().subscribe(signalQuality => {
   *   console.log(signalQuality);
   * });
   *
   * // { FC6: { standardDeviation: 3.5, status: "good" }, C3: {...}, ... }
   * ```
   *
   * @returns Observable of signalQuality metric events
   */
  public signalQuality(): Observable<SignalQuality> {
    const metric = "signalQuality";
    return this.getMetric({
      metric,
      labels: getLabels(metric),
      atomic: true
    });
  }

  /**
   * @internal
   * Proof of Concept for `emotion` - Not user facing yet
   *
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
   * Observes last state of `settings` and all subsequent `settings` changes
   *
   * ```typescript
   * notion.settings().subscribe(settings => {
   *   console.log(settings.lsl);
   * });
   *
   * // true
   * // ...
   * ```
   *
   * @returns Observable of `settings` metric events
   */
  public settings(): Observable<Settings> {
    const namespace = "settings";
    return new Observable(observer => {
      const listener = this.api.onNamespace(
        namespace,
        (settings: Settings) => {
          observer.next(settings);
        }
      );

      return () => this.api.offNamespace(namespace, listener);
    });
  }

  /**
   * Example
   * ```typescript
   * notion.focus().subscribe(focus => {
   *   console.log(focus.probability);
   * });
   *
   * // 0.56
   * // 0.46
   * // 0.31
   * // 0.39
   * // ...
   * ```
   *
   * @returns Observable of focus events - awareness/focus alias
   */
  public focus(): Observable<Focus> {
    return this.awareness("focus");
  }

  /**
   * @param labels Name of metric properties to filter by
   * @returns Observable of kinesis metric events
   */
  public kinesis(
    label: string,
    ...otherLabels: string[]
  ): Observable<Kinesis> {
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
   * Observes last state of `status` and all subsequent `status` changes
   *
   * ```typescript
   * notion.status().subscribe(status => {
   *   console.log(status.state);
   * });
   *
   * // "online"
   * // ...
   * ```
   *
   * @returns Observable of `status` metric events
   */
  public status(): Observable<DeviceStatus> {
    const namespace = "status";
    const updateStatusInterval = 2000;

    return new Observable(observer => {
      const updateStatusSubscription = timer(
        0,
        updateStatusInterval
      ).subscribe(i => {
        this.api
          .httpsCallable("updateDeviceStatus", {
            deviceId: this.options.deviceId
          })
          .catch(console.error);
      });

      const listener = this.api.onNamespace(namespace, status => {
        observer.next(status);
      });

      return () => {
        updateStatusSubscription.unsubscribe();
        this.api.offNamespace(namespace, listener);
      };
    });
  }

  /**
   * @internal
   * Not user facing yet
   *
   * Changes device settings programatically. These settings can be
   * also changed from the developer console under device settings.
   *
   * Available settings [[ChangeSettings]]
   *
   * Example
   * ```typescript
   * notion.changeSettings({
   *   lsl: true
   * });
   * ```
   */
  public changeSettings(settings: ChangeSettings): Promise<void> {
    return this.api.changeSettings(settings);
  }

  /**
   *
   * ```typescript
   * notion.training.record({
   *   metric: "kinesis",
   *   label: "push"
   * });
   *
   * notion.training.stop({
   *   metric: "kinesis",
   *   label: "push"
   * });
   * ```
   *
   * @returns Training methods
   */
  public get training(): Training {
    return {
      /**
       * Records a training for a metric/label pair
       * @category Training
       */
      record: training => {
        const userId =
          this.api.user && "uid" in this.api.user
            ? this.api.user.uid
            : null;
        const message = {
          fit: false,
          baseline: false,
          timestamp: this.api.timestamp,
          ...training,
          userId
        };
        this.api.actions.dispatch({
          command: "training",
          action: "record",
          message
        });
      },
      /**
       * Stops the training for a metric/label pair
       * @category Training
       */
      stop: training => {
        this.api.actions.dispatch({
          command: "training",
          action: "stop",
          message: {
            ...training
          }
        });
      },
      /**
       * Stops all trainings
       * @category Training
       */
      stopAll: () => {
        this.api.actions.dispatch({
          command: "training",
          action: "stopAll",
          message: {}
        });
      }
    };
  }

  /**
   * @internal
   * Proof of Concept for Skills - Not user facing yet
   *
   * Accesses a skill by Bundle ID. Additionally, allows to observe
   * and push skill metrics
   *
   * @param bundleId Bundle ID of skill
   * @returns Skill isntance
   */
  public async skill(bundleId: string): Promise<SkillInstance> {
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
          const subscription: Subscription = this.api.metrics.subscribe(
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
