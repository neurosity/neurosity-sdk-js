# v7.2.1

- FIX: `isMaybeWebWorkerContext()` now actually detects worker context. The helper read top-level `this` (which is `undefined` in ES modules — rollup warned about the rewrite on every build), so it returned a falsy value unconditionally. Reference `self` as a global via `typeof self` instead. The only consumer (`isWebBluetoothSupported`) short-circuited on `typeof window` first, so no visible runtime impact — but the primitive on its own was broken and the build noise is gone.

# v7.2.0

- FIX: `selectDevice()` race — `observeNamespace(...)` subscribers (including `status()` and `osVersion()`) attached their RTDB listeners to the outgoing `FirebaseDevice` on every device switch. The v7 refactor had made the `onDeviceChange` subscriber async and awaited `disconnect()` before assigning `this.firebaseDevice = new FirebaseDevice(...)` — so subscribers delivered on the same emission read the stale device. Restores v6's synchronous swap; disconnect is now fire-and-forget with error logging.

# v7.1.0

- FEAT: Added `signalQualityV2()` method with normalized 0-1 scores per channel and overall score
- Updated `@neurosity/ipk` to v2.13.0

# v5.0.0

- FEAT: Auto & manual device selection via `neurosity.selectDevice(...)` method
- FEAT: new methods: `neurosity.getDevices()` and `neurosity.onDeviceChange()`
- FIX: #46 Notion sends 1 packet of data even though it is asleep
- FIX: only send timesync actions if and when device is online

# v4.0.0

- Added types
- Improved documentation (Reference)

# v3.10.0

- Added periodic device status update call while subscribed to status

# v3.9.0

- Added clients connections and remove them when offline

# v3.8.1

### Package Updates

- Update IPK to v1.7.0
