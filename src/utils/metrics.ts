import { Observable, throwError, EMPTY } from "rxjs";
import { switchMap } from "rxjs/operators";
import { whileOnline } from "./whileOnline";

import { validate, isNotionMetric } from "./subscription";
import {
  PendingSubscription,
  Subscription
} from "../types/subscriptions";
import { DeviceInfo } from "../types/deviceInfo";

/**
 * @internal
 */
export function getMetric(
  dependencies,
  subscription: PendingSubscription
): Observable<any> {
  const {
    options,
    api,
    onDeviceChange,
    isLocalMode,
    socketUrl,
    status
  } = dependencies;

  const { metric, labels, atomic } = subscription;

  const metricError = validate(metric, labels, options);
  if (metricError) {
    return throwError(() => metricError);
  }

  const subscribeTo = (serverType: string) =>
    new Observable((observer) => {
      const subscriptions: Subscription[] = atomic
        ? [
            api.metrics.subscribe({
              metric: metric,
              labels: labels,
              atomic: atomic,
              serverType: serverType
            })
          ]
        : labels.map((label) => {
            return api.metrics.subscribe({
              metric: metric,
              labels: [label],
              atomic: atomic,
              serverType: serverType
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

  return onDeviceChange().pipe(
    switchMap((device: DeviceInfo) => {
      if (!device) {
        return EMPTY;
      }

      const { deviceId } = device;

      return isLocalMode().pipe(
        switchMap((isLocalMode) => {
          if (isLocalMode && isNotionMetric(metric)) {
            return socketUrl().pipe(
              switchMap((socketUrl) =>
                api.setWebsocket(socketUrl, deviceId)
              ),
              switchMap(() => subscribeTo(api.localServerType))
            );
          }

          api.unsetWebsocket();
          return subscribeTo(api.defaultServerType);
        })
      );
    }),
    whileOnline({
      status$: status(),
      allowWhileOnSleepMode: false
    })
  );
}
