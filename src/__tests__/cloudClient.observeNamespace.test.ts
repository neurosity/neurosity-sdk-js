/**
 * Regression: observeNamespace races with FirebaseDevice replacement on selectDevice.
 *
 * When `selectDevice(B)` is called on a CloudClient that already has
 * FirebaseDevice(A), the constructor's onDeviceChange subscriber AWAITS
 * `firebaseDevice.disconnect()` before assigning `this.firebaseDevice = new
 * FirebaseDevice(B)`. Any other subscriber delivered on the same
 * `_selectedDevice.next(B)` emission (e.g. `observeNamespace("status")`'s
 * switchMap inner) synchronously reads `this.firebaseDevice` while it still
 * points at the OLD (A) instance. The listener attaches to A (or to a
 * disconnecting A) and the new device's RTDB paths are never subscribed to.
 *
 * Symptom downstream (verified via Chrome DevTools RTDB WebSocket tracing in
 * the console-next app): after `selectDevice(B)`, no LISTEN frame is sent on
 * `/devices/{B}/status`. status() therefore sits silent until the user
 * manually re-selects the same device, which puts the sync reader back on
 * the winning side of the race.
 *
 * Fix: assign `this.firebaseDevice` synchronously inside the subscriber,
 * BEFORE any await. The old device's disconnect still runs, but
 * fire-and-forget, so subsequent subscribers on the same emission read the
 * new instance.
 */

import { ReplaySubject } from "rxjs";
import { take, toArray } from "rxjs/operators";

import { CloudClient } from "../api";

// Mock FirebaseApp — we don't want to actually initialize Firebase in unit tests.
jest.mock("../api/firebase/FirebaseApp", () => {
  class MockFirebaseApp {
    public app = { name: "mock-app" };
    public options = {};
    constructor(options: unknown) {
      this.options = options ?? {};
    }
    async disconnect() {
      /* no-op */
    }
  }
  return { FirebaseApp: MockFirebaseApp };
});

// Mock FirebaseUser — status() path doesn't depend on auth, and we bypass login.
jest.mock("../api/firebase/FirebaseUser", () => {
  const { BehaviorSubject, Subject } = require("rxjs");
  class MockFirebaseUser {
    private _auth = new BehaviorSubject<null>(null);
    private _claims = new Subject<unknown>();
    constructor(_app: unknown) {}
    onAuthStateChanged() {
      return this._auth.asObservable();
    }
    onUserClaimsChange() {
      return this._claims.asObservable();
    }
  }
  return { FirebaseUser: MockFirebaseUser };
});

// Track every FirebaseDevice instance the CloudClient creates, plus every
// onNamespace/disconnect call, so the test can assert which instance a given
// listener got attached to.
interface DeviceProbe {
  deviceId: string;
  onNamespaceCalls: Array<{ namespace: string; handler: (v: unknown) => void }>;
  offNamespaceCalls: Array<{ namespace: string; handler: Function }>;
  disconnected: boolean;
  /** Emit a value as if RTDB delivered it at this namespace. */
  emit: (namespace: string, value: unknown) => void;
}
const probes: DeviceProbe[] = [];

jest.mock("../api/firebase/FirebaseDevice", () => {
  class MockFirebaseDevice {
    public deviceId: string;
    private onByNamespace = new Map<string, Array<(v: unknown) => void>>();
    private probe: DeviceProbe;
    constructor({ deviceId }: { deviceId: string; firebaseApp: unknown; dependencies: unknown }) {
      this.deviceId = deviceId;
      this.probe = {
        deviceId,
        onNamespaceCalls: [],
        offNamespaceCalls: [],
        disconnected: false,
        emit: (namespace, value) => {
          (this.onByNamespace.get(namespace) ?? []).forEach((h) => h(value));
        },
      };
      probes.push(this.probe);
    }
    onNamespace(namespace: string, handler: (v: unknown) => void): Function {
      this.probe.onNamespaceCalls.push({ namespace, handler });
      const list = this.onByNamespace.get(namespace) ?? [];
      list.push(handler);
      this.onByNamespace.set(namespace, list);
      return () => this.offNamespace(namespace, handler);
    }
    offNamespace(namespace: string, handler: Function): void {
      this.probe.offNamespaceCalls.push({ namespace, handler });
      const list = this.onByNamespace.get(namespace) ?? [];
      this.onByNamespace.set(
        namespace,
        list.filter((h) => h !== handler)
      );
    }
    async disconnect() {
      this.probe.disconnected = true;
      // Realistic: awaitable, microtask boundary. This is what creates the race.
      await Promise.resolve();
    }
  }
  return { FirebaseDevice: MockFirebaseDevice };
});

const deviceA = {
  deviceId: "device-a",
  deviceNickname: "A",
  channelNames: [],
  channels: 0,
  samplingRate: 0,
  manufacturer: "",
  model: "",
  modelName: "",
  modelVersion: "",
  apiVersion: "",
  osVersion: "",
  emulator: false,
} as any;

const deviceB = {
  ...deviceA,
  deviceId: "device-b",
  deviceNickname: "B",
} as any;

describe("CloudClient.observeNamespace on device switch", () => {
  beforeEach(() => {
    probes.length = 0;
  });

  it("attaches subsequent observeNamespace listeners to the NEW FirebaseDevice after a switch", async () => {
    const client = new CloudClient({} as any);

    // Drive `_selectedDevice` directly; skip the login/getDevices dance. The
    // subject is private, but so is the bug — poke it the way selectDevice()
    // would. The constructor's subscriber fires on each `next`.
    const sel = (client as any)._selectedDevice as ReplaySubject<any>;

    sel.next(deviceA);
    // Let the async onDeviceChange subscriber finish creating FirebaseDevice(A).
    await flushMicrotasks();
    expect(probes).toHaveLength(1);
    expect(probes[0]!.deviceId).toBe("device-a");

    // Subscribe to observeNamespace("status") — simulates what status$ does.
    const values: unknown[] = [];
    const sub = client.observeNamespace("status").subscribe((v) => values.push(v));

    // switchMap(selectedDevice → fromEventPattern) should have attached a
    // handler to FirebaseDevice(A) by now.
    const aStatusHandlers = probes[0]!.onNamespaceCalls.filter(
      (c) => c.namespace === "status"
    );
    expect(aStatusHandlers).toHaveLength(1);

    // Switch to device B. This is where the race lives.
    sel.next(deviceB);
    await flushMicrotasks();

    // FirebaseDevice(B) should now exist.
    expect(probes).toHaveLength(2);
    expect(probes[1]!.deviceId).toBe("device-b");

    // And — critically — the observeNamespace listener should now be
    // attached to FirebaseDevice(B), because its switchMap inner re-subscribes
    // on every `_selectedDevice` emission.
    const bStatusHandlers = probes[1]!.onNamespaceCalls.filter(
      (c) => c.namespace === "status"
    );
    expect(bStatusHandlers).toHaveLength(1);

    // Prove end-to-end: emit a value from FirebaseDevice(B) and confirm the
    // subscription sees it. Before the fix this emission is never delivered
    // because the listener was attached to (A)'s deviceStore, not (B)'s.
    probes[1]!.emit("status", { state: "online", battery: 100 });
    expect(values).toContainEqual({ state: "online", battery: 100 });

    sub.unsubscribe();
  });
});

function flushMicrotasks(): Promise<void> {
  // Two ticks: the disconnect's Promise.resolve() + the assignment
  // that follows it inside the async subscriber.
  return new Promise((r) => setImmediate(r));
}
