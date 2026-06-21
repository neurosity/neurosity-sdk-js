# v8.0.0

The Crown Community Ensembles release. Closes the 7.x line with a security
sweep and bumps the dev-tooling baseline. The new public methods listed
below are **additive** — `kinesis(label)` semantics are unchanged for
existing apps, and become transparently STIG-backed when the firmware
resolver picks an ensemble for the active label.

The major bump is a courtesy signal for the dev-baseline jump (jest 30,
audited dependency tree) and the new community-ensembles era. No
breaking changes to the public TypeScript surface.

## Crown Community Ensembles (R1 + R2 SDK surface)

New methods on `Neurosity`:

- `deviceHealth()` — Observable host-side telemetry (per-core CPU load, free memory, SoC temperature, thermal-throttle flag) backing the Studio device-health strip and the analytics container's adaptive refit throttle.
- `kinesisEnsemble(opts)` — requests an ensemble-backed Kinesis stream for a label. Writes the resolver override to `users/{uid}/ensembleSessions/{label}` before subscribing; emits Kinesis events on the same transport as `kinesis(label)`.
- `kinesisEnsembleStatus()` — Observable engine health (donor count, SML personalization score, current refit cadence, `lastRefitAt`).
- `contributeClassifier({ classifierId, share })` — opts a classifier into (or revokes from) the community donor pool. Writes directly to the `memories/{classifierId}` doc; the `onClassifierSharingEnabled` Firestore trigger handles HMAC contributor-id minting and gate enqueue.
- `myClassifiers()` — Firestore live read of the user's own classifier docs (sharing state, gate score, fleet stats). Queries `memories` filtered by `userId + type==="classifier"`.
- `listEnsembles({ label })` — hardware-filtered listing of system- and user-curated ensembles. The cloud query filters by label (rules world-read); the SDK enforces `hardware.modelId === device.modelName` locally so a device never sees an incompatible bundle.

Behavioral note: `kinesis(label)` is transparently STIG-backed when the firmware resolver has selected an ensemble for that label — no migration required. Apps wanting explicit control over the bundle, refit cadence, or spectral-learning toggle use `kinesisEnsemble(...)`.

New exported types: `DeviceHealth`, `KinesisEnsembleOptions`, `EnsembleStatus`, `MyClassifier`, `EnsembleSummary`.

## Security & dependency cleanup

- SEC: Resolved all 5 high-severity vulnerabilities via `npm audit fix` (axios CVE chain + 4 firebase transitives: `@grpc/grpc-js`, `protobufjs`, `fast-uri`, `form-data`). 0 critical / 0 high remain.
- DEV: Bumped jest 29 → 30 (+ `@types/jest@^30`). Closes 3 of the moderate transitives; remaining 18 are dev-only DoS bugs in `babel-plugin-istanbul` / `js-yaml` transitives pinned by `ts-jest@29.4` (no `ts-jest@30` published as of writing). Documented for the next sweep.
- Audit tree: 27 → 18 vulns (0 critical, 0 high, 18 moderate dev-only, 0 low).

# v7.5.0

- FEAT: Complete the experiment API so the console can drop client-side RTDB entirely. (1) `Experiment` and `CreateExperimentOptions` now model the full session shape — `kind` (`training`/`recording`), `protocol`, `notes`, `durationMs`, `recordingState`, `recordingStartedAt`, `recordingId` — and `createUserExperiment` applies the training/recording defaults. (2) Added `onExperimentMarkers(experimentId)` — the live read counterpart to `addExperimentMarker`. (3) Added `setEmulatorStatus(deviceId, { state?, charging? })` for emulator/dev tooling that simulates device status. New exported types: `SessionKind`, `TrainingProtocol`, `RecordingState`, `EmulatorStatusPatch`.

# v7.4.0

- FEAT: Experiment write methods, so apps no longer touch RTDB directly for Studio data. Added `createUserExperiment(options)`, `updateUserExperiment(id, patch)`, `addExperimentMarker(id, marker)`, `saveExperimentTrial(id, trial)`, and `saveExperimentPrediction(id, prediction)` — siblings of the existing `onUserExperiments()` / `deleteUserExperiment()`. New exported types: `CreateExperimentOptions`, `ExperimentMarker`, `ExperimentTrial`, `ExperimentPrediction`. Full unit coverage of RTDB paths + payloads.

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
