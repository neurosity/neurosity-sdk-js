const { pipe, timer } = require("rxjs");
const {
  distinctUntilChanged,
  map,
  switchMap
} = require("rxjs/operators");

// `lastHeartbeat` is updated every 30 seconds via os
const lastHeartbeatUpdateInterval = 30000;
const maxHeartbeatsSkipped = 3;
const gracePeriod = 5000;

timer(0, 1000)
  .pipe(
    map(() => ({
      __balenaOverallStatus: "offline",
      __osState: "offline",
      battery: 99,
      charging: true,
      claimedBy: "dHGLTb5q23ZOatNpoDSizgkbRhZ2",
      lastHeartbeat: 1626203568114,
      onlineLast: 1626203583737,
      simulate: false,
      sleepMode: false,
      ssid: "Cowper+",
      state: "offline"
    })),
    offlineIfLostHeartbeat(),
    filterInternalKeys()
  )
  .subscribe((x) => {
    console.log("TIMEERRRRRR", x);
  });

// 65 seconds
const lostHeartbeatThreshold =
  lastHeartbeatUpdateInterval * maxHeartbeatsSkipped + gracePeriod;

function offlineIfLostHeartbeat() {
  return pipe(
    switchMap((status) => {
      return timer(0, lostHeartbeatThreshold).pipe(
        map(() => {
          console.log(
            "************ offlineIfLostHeartbeat map() ************",
            status
          );
          if (deviceHasLostHeartbeat(status)) {
            console.log(
              "************ deviceHasLostHeartbeat() ************",
              deviceHasLostHeartbeat(status)
            );
            return {
              ...status,
              state: "offline"
            };
          }

          console.log("************ no override ************", status);

          return status;
        })
      );
    }),
    distinctUntilChanged(didObjectChange)
  );
}

function deviceHasLostHeartbeat(status) {
  if (!status?.lastHeartbeat) {
    return false;
  }

  const { lastHeartbeat } = status;

  const timeSinceLastHeartbeat = Date.now() - lastHeartbeat;
  const lostHeartbeat = timeSinceLastHeartbeat > lostHeartbeatThreshold;

  return lostHeartbeat;
}

function didObjectChange(a, b) {
  return (
    JSON.stringify(a).split("").sort().join("") ===
    JSON.stringify(b).split("").sort().join("")
  );
}

function filterInternalKeys() {
  return pipe(
    map((status) => {
      if (!status) {
        return status;
      }

      // remove internal properties that start with "__"
      const filteredStatus = Object.entries(status).reduce(
        (acc, [key, value]) => {
          if (!key.startsWith("__")) {
            acc[key] = value;
          }
          return acc;
        },
        {}
      );

      return filteredStatus;
    })
  );
}
