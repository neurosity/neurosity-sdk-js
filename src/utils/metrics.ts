import { Observable, throwError } from "rxjs";
import { whileOnline } from "./whileOnline";

import { validate } from "./subscription";
import {
  PendingSubscription,
  Subscription
} from "../types/subscriptions";

/**
 * @internal
 */
export function getMetric(
  dependencies,
  subscription: PendingSubscription
): Observable<any> {
  const { options, api, status } = dependencies;

  const { metric, labels, atomic } = subscription;

  const metricError = validate(metric, labels, options);
  if (metricError) {
    return throwError(() => metricError);
  }

  const metric$ = new Observable((observer) => {
    const subscriptions: Subscription[] = atomic
      ? [
          api.metrics.subscribe({
            metric: metric,
            labels: labels,
            atomic: atomic
          })
        ]
      : labels.map((label) => {
          return api.metrics.subscribe({
            metric: metric,
            labels: [label],
            atomic: atomic
          });
        });

    const subscriptionWithListeners = subscriptions.map(
      (subscription) => ({
        subscription,
        listener: api.metrics.on(subscription, (...data: any) => {
          observer.next(...data);
        })
      })
    );

    return () => {
      subscriptionWithListeners.forEach(
        ({ subscription, listener }) => {
          api.metrics.unsubscribe(subscription, listener);
        }
      );
    };
  });

  return metric$.pipe(
    whileOnline({
      status$: status(),
      allowWhileOnSleepMode: false
    })
  );
}
