import { Observable, throwError, EMPTY } from "rxjs";
import { switchMap } from "rxjs/operators";

import { whileOnline } from "./whileOnline";
import { validate } from "./subscription";
import { PendingSubscription, Subscription } from "../types/subscriptions";
import { DeviceInfo } from "../types/deviceInfo";

/**
 * @internal
 */
export function getCloudMetric(
  dependencies,
  subscription: PendingSubscription
): Observable<any> {
  const { options, cloudClient, onDeviceChange, status } = dependencies;

  const { metric, labels, atomic } = subscription;

  const metricError = validate(metric, labels, options);
  if (metricError) {
    return throwError(() => metricError);
  }

  const metric$ = new Observable((observer) => {
    const subscriptions: Subscription[] = atomic
      ? [
          cloudClient.metrics.subscribe({
            metric: metric,
            labels: labels,
            atomic: atomic
          })
        ]
      : labels.map((label) => {
          return cloudClient.metrics.subscribe({
            metric: metric,
            labels: [label],
            atomic: atomic
          });
        });

    const subscriptionWithListeners = subscriptions.map((subscription) => ({
      subscription,
      listener: cloudClient.metrics.on(subscription, (...data: any) => {
        observer.next(...data);
      })
    }));

    return () => {
      subscriptionWithListeners.forEach(({ subscription, listener }) => {
        cloudClient.metrics.unsubscribe(subscription, listener);
      });
    };
  });

  return onDeviceChange().pipe(
    switchMap((device: DeviceInfo) => {
      if (!device) {
        return EMPTY;
      }

      return metric$.pipe(
        whileOnline({
          status$: status(),
          allowWhileOnSleepMode: false
        })
      );
    })
  );
}
