/**
 * Unit tests for the experiment write methods on FirebaseUser:
 * createUserExperiment / updateUserExperiment / addExperimentMarker /
 * saveExperimentTrial / saveExperimentPrediction.
 *
 * We mock firebase/database so we can assert the exact RTDB paths + payloads
 * each method writes, without standing up Firebase.
 */

jest.mock("firebase/database", () => {
  return {
    getDatabase: jest.fn(() => ({ __db: true })),
    ref: jest.fn((_db: unknown, path: string) => ({ path })),
    push: jest.fn((parent: { path: string }) => ({
      path: `${parent.path}/genkey`,
      key: "genkey"
    })),
    set: jest.fn(async () => undefined),
    update: jest.fn(async () => undefined),
    serverTimestamp: jest.fn(() => "SERVER_TS"),
    // unused by these methods but imported by FirebaseUser:
    remove: jest.fn(),
    get: jest.fn(),
    onValue: jest.fn(),
    off: jest.fn(),
    query: jest.fn(),
    orderByChild: jest.fn(),
    equalTo: jest.fn(),
    limitToFirst: jest.fn(),
    DataSnapshot: class {}
  };
});

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({})),
  onAuthStateChanged: jest.fn()
}));

jest.mock("firebase/functions", () => ({
  getFunctions: jest.fn(() => ({})),
  httpsCallable: jest.fn(() => jest.fn(async () => undefined))
}));

import * as database from "firebase/database";
import { FirebaseUser } from "../api/firebase/FirebaseUser";

const ref = database.ref as jest.Mock;
const set = database.set as jest.Mock;
const update = database.update as jest.Mock;

function makeUser(uid: string | null): FirebaseUser {
  const fu = new FirebaseUser({ app: { name: "mock" } } as never);
  fu.user = uid ? ({ uid } as never) : null;
  return fu;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("createUserExperiment", () => {
  it("rejects when not authenticated", async () => {
    await expect(
      makeUser(null).createUserExperiment({ deviceId: "d1" })
    ).rejects.toMatch(/not authenticated/);
  });

  it("rejects without a deviceId", async () => {
    await expect(
      makeUser("u1").createUserExperiment({} as never)
    ).rejects.toMatch(/deviceId/);
  });

  it("pushes to /experiments with userId, deviceId, defaults, and returns the key", async () => {
    const id = await makeUser("u1").createUserExperiment({
      deviceId: "d1",
      name: "Pinch",
      labels: ["leftHandPinch"]
    });
    expect(ref).toHaveBeenCalledWith(expect.anything(), "experiments");
    const payload = set.mock.calls[0][1];
    expect(payload).toMatchObject({
      userId: "u1",
      deviceId: "d1",
      name: "Pinch",
      labels: ["leftHandPinch"],
      totalTrials: 0,
      timestamp: "SERVER_TS"
    });
    expect(id).toBe("genkey");
  });

  it("defaults name and labels when omitted", async () => {
    await makeUser("u1").createUserExperiment({ deviceId: "d1" });
    const payload = set.mock.calls[0][1];
    expect(payload.labels).toEqual([]);
    expect(typeof payload.name).toBe("string");
    expect(payload.name.length).toBeGreaterThan(0);
  });
});

describe("updateUserExperiment", () => {
  it("rejects without an experiment id", async () => {
    await expect(
      makeUser("u1").updateUserExperiment("", { name: "x" })
    ).rejects.toMatch(/experiment id/);
  });

  it("updates /experiments/$id with the patch", async () => {
    await makeUser("u1").updateUserExperiment("e1", { name: "Renamed" });
    expect(ref).toHaveBeenCalledWith(expect.anything(), "experiments/e1");
    expect(update).toHaveBeenCalledWith(expect.anything(), { name: "Renamed" });
  });
});

describe("addExperimentMarker", () => {
  it("rejects without an experiment id", async () => {
    await expect(
      makeUser("u1").addExperimentMarker("", { label: "drop", timestamp: 1 })
    ).rejects.toMatch(/experiment id/);
  });

  it("rejects without a marker label", async () => {
    await expect(
      makeUser("u1").addExperimentMarker("e1", { timestamp: 1 } as never)
    ).rejects.toMatch(/marker label/);
  });

  it("pushes under /experiments/$id/markers and returns the key", async () => {
    const id = await makeUser("u1").addExperimentMarker("e1", {
      label: "drop",
      timestamp: 123
    });
    expect(ref).toHaveBeenCalledWith(
      expect.anything(),
      "experiments/e1/markers"
    );
    expect(set.mock.calls[0][1]).toMatchObject({ label: "drop", timestamp: 123 });
    expect(id).toBe("genkey");
  });
});

describe("saveExperimentTrial", () => {
  it("rejects without an experiment id", async () => {
    await expect(
      makeUser("u1").saveExperimentTrial("", { label: "drop" })
    ).rejects.toMatch(/experiment id/);
  });

  it("pushes under /trials/$id and defaults the timestamp", async () => {
    await makeUser("u1").saveExperimentTrial("e1", { label: "drop" });
    expect(ref).toHaveBeenCalledWith(expect.anything(), "trials/e1");
    expect(set.mock.calls[0][1]).toMatchObject({
      label: "drop",
      timestamp: "SERVER_TS"
    });
  });

  it("preserves a caller-provided timestamp", async () => {
    await makeUser("u1").saveExperimentTrial("e1", { label: "drop", timestamp: 999 });
    expect(set.mock.calls[0][1].timestamp).toBe(999);
  });
});

describe("saveExperimentPrediction", () => {
  it("rejects without an experiment id", async () => {
    await expect(
      makeUser("u1").saveExperimentPrediction("", {
        trial: 0,
        label: "drop",
        probability: 0.9,
        metric: "kinesis"
      })
    ).rejects.toMatch(/experiment id/);
  });

  it("pushes under /predictions/$id with the payload", async () => {
    await makeUser("u1").saveExperimentPrediction("e1", {
      trial: 0,
      label: "drop",
      probability: 0.9,
      metric: "kinesis"
    });
    expect(ref).toHaveBeenCalledWith(expect.anything(), "predictions/e1");
    expect(set.mock.calls[0][1]).toMatchObject({
      label: "drop",
      probability: 0.9,
      metric: "kinesis",
      timestamp: "SERVER_TS"
    });
  });
});

describe("createUserExperiment — session kinds", () => {
  it("defaults a training experiment with protocol kinesis and no recording fields", async () => {
    await makeUser("u1").createUserExperiment({ deviceId: "d1", kind: "training" });
    const p = set.mock.calls[0][1];
    expect(p.kind).toBe("training");
    expect(p.protocol).toBe("kinesis");
    expect(p.recordingState).toBeUndefined();
    expect(p.durationMs).toBeUndefined();
  });

  it("creates a recording experiment with durationMs + recordingState idle, no protocol", async () => {
    await makeUser("u1").createUserExperiment({ deviceId: "d1", kind: "recording" });
    const p = set.mock.calls[0][1];
    expect(p.kind).toBe("recording");
    expect(p.recordingState).toBe("idle");
    expect(p.durationMs).toBe(5 * 60 * 1000);
    expect(p.protocol).toBeUndefined();
  });

  it("respects explicit durationMs + notes", async () => {
    await makeUser("u1").createUserExperiment({
      deviceId: "d1",
      kind: "recording",
      durationMs: 1000,
      notes: "session A"
    });
    const p = set.mock.calls[0][1];
    expect(p.durationMs).toBe(1000);
    expect(p.notes).toBe("session A");
  });

  it("defaults kind to training when omitted", async () => {
    await makeUser("u1").createUserExperiment({ deviceId: "d1" });
    expect(set.mock.calls[0][1].kind).toBe("training");
  });
});

describe("onExperimentMarkers", () => {
  it("maps the markers map to a list sorted by timestamp, each with its id", async () => {
    (database.onValue as jest.Mock).mockImplementation((_r: unknown, cb: any) => {
      cb({
        val: () => ({
          b: { label: "lift", timestamp: 20 },
          a: { label: "drop", timestamp: 10 }
        })
      });
      return () => undefined;
    });
    const markers = await new Promise<any[]>((resolve) => {
      const sub = makeUser("u1")
        .onExperimentMarkers("e1")
        .subscribe((m) => {
          resolve(m);
          setTimeout(() => sub.unsubscribe(), 0);
        });
    });
    expect(ref).toHaveBeenCalledWith(expect.anything(), "experiments/e1/markers");
    expect(markers.map((m) => m.id)).toEqual(["a", "b"]);
    expect(markers[0]).toMatchObject({ id: "a", label: "drop", timestamp: 10 });
  });
});

describe("setEmulatorStatus", () => {
  it("rejects without a deviceId", async () => {
    await expect(
      makeUser("u1").setEmulatorStatus("", { state: "online" })
    ).rejects.toMatch(/deviceId/);
  });

  it("updates devices/$id/status with the state patch", async () => {
    await makeUser("u1").setEmulatorStatus("dev1", { state: "online" });
    expect(ref).toHaveBeenCalledWith(expect.anything(), "devices/dev1/status");
    expect(update).toHaveBeenCalledWith(expect.anything(), { state: "online" });
  });

  it("can toggle charging", async () => {
    await makeUser("u1").setEmulatorStatus("dev1", { charging: true });
    expect(update).toHaveBeenCalledWith(expect.anything(), { charging: true });
  });
});
