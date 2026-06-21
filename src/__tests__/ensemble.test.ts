import { Neurosity } from "../Neurosity";
import { BehaviorSubject, of } from "rxjs";
import { take, toArray } from "rxjs/operators";
import { STATUS, DeviceStatus } from "../types/status";
import { PendingSubscription, Subscription } from "../types/subscriptions";
import {
  EnsembleStatus,
  MyClassifier,
  EnsembleSummary
} from "../types/ensemble";

// -----------------------------------------------------------------------------
// Mocks
// -----------------------------------------------------------------------------

// Track Firestore writes for assertions.
const firestoreWrites: Array<{
  op: "setDoc" | "updateDoc";
  path: string;
  data: any;
}> = [];

// myClassifiers snapshot pump.
let myClassifiersSnapshotPump:
  | ((docs: MyClassifier[]) => void)
  | null = null;

// listEnsembles fixture (server-side query result before SDK hardware filter).
let listEnsemblesFixture: EnsembleSummary[] = [];

jest.mock("firebase/firestore", () => {
  const docRef = (path: string) => ({ __path: path, path });
  return {
    getFirestore: jest.fn(() => ({})),
    collection: jest.fn((_db: any, path: string) => ({ __path: path, path })),
    doc: jest.fn((dbOrCollection: any, ...segments: string[]) => {
      const base =
        dbOrCollection && typeof dbOrCollection.__path === "string"
          ? dbOrCollection.__path
          : "";
      const path = [base, ...segments].filter(Boolean).join("/");
      return docRef(path);
    }),
    query: jest.fn((coll: any, ..._constraints: any[]) => coll),
    where: jest.fn((field: string, op: string, value: any) => ({
      field,
      op,
      value
    })),
    setDoc: jest.fn(async (ref: any, data: any) => {
      firestoreWrites.push({ op: "setDoc", path: ref.__path, data });
    }),
    updateDoc: jest.fn(async (ref: any, data: any) => {
      firestoreWrites.push({ op: "updateDoc", path: ref.__path, data });
    }),
    onSnapshot: jest.fn((_ref: any, cb: any) => {
      myClassifiersSnapshotPump = (docs: MyClassifier[]) => {
        cb({
          docs: docs.map((d) => ({
            id: d.id,
            data: () => d
          }))
        });
      };
      return () => {
        myClassifiersSnapshotPump = null;
      };
    }),
    getDocs: jest.fn(async (_q: any) => ({
      docs: listEnsemblesFixture.map((d) => ({
        id: d.id,
        data: () => d
      }))
    })),
    updateDoc: jest.fn(async (ref: any, data: any) => {
      firestoreWrites.push({ op: "updateDoc", path: ref.__path, data });
    }),
    serverTimestamp: jest.fn(() => "__server_timestamp__")
  };
});

// Mock CloudClient — mirrors metrics.test.ts.
jest.mock("../api/index", () => {
  const mockCloudClient = {
    login: jest.fn(),
    logout: jest.fn(),
    onAuthStateChanged: jest.fn(),
    onDeviceChange: jest.fn(),
    status: jest.fn(),
    metrics: {
      on: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn()
    },
    osVersion: jest.fn(),
    userClaims: {
      scopes: ["focus", "kinesis", "status"]
    },
    user: { uid: "test-user-id" },
    __getApp: jest.fn(() => ({}))
  };

  return {
    CloudClient: jest.fn().mockImplementation(() => mockCloudClient)
  };
});

const testDeviceId = "mock-device-id";

const mockDeviceInfo = {
  deviceId: testDeviceId,
  channelNames: ["CP3", "C3", "F5", "PO3", "PO4", "F6", "C4", "CP4"],
  samplingRate: 256,
  modelName: "crown",
  modelVersion: "v3"
};

describe("Crown Community Ensembles", () => {
  let neurosity: Neurosity;
  let mockKinesis$: BehaviorSubject<any>;
  let mockEnsembleStatus$: BehaviorSubject<EnsembleStatus>;
  let cloudClient: any;

  beforeEach(() => {
    firestoreWrites.length = 0;
    myClassifiersSnapshotPump = null;
    listEnsemblesFixture = [];

    neurosity = new Neurosity({
      deviceId: testDeviceId,
      emulator: true
    });

    cloudClient = (neurosity as any).cloudClient;

    const mockDeviceStatus: DeviceStatus = {
      state: STATUS.ONLINE,
      charging: false,
      battery: 100,
      sleepMode: false,
      sleepModeReason: null,
      lastHeartbeat: Date.now(),
      ssid: "test-network"
    };

    mockKinesis$ = new BehaviorSubject({
      probability: 0.81,
      label: "leftArm",
      metric: "kinesis",
      timestamp: Date.now()
    });

    mockEnsembleStatus$ = new BehaviorSubject<EnsembleStatus>({
      active: true,
      donorCount: 6,
      personalizationScore: 0.42,
      lastRefitAt: 1_000,
      currentRefitIntervalSecs: 60
    });

    cloudClient.onDeviceChange.mockReturnValue(of(mockDeviceInfo));
    cloudClient.status.mockReturnValue(of(mockDeviceStatus));
    cloudClient.osVersion.mockReturnValue(of("16.0.0"));

    cloudClient.metrics.subscribe.mockImplementation(
      (subscription: PendingSubscription) => {
        return { id: `sub-${subscription.metric}`, ...subscription };
      }
    );

    cloudClient.metrics.on.mockImplementation(
      (subscription: Subscription, callback: (value: any) => void) => {
        if (subscription.metric === "kinesis") {
          const sub = mockKinesis$.subscribe((value) => callback(value));
          return () => sub.unsubscribe();
        }
        if (subscription.metric === "ensembleStatus") {
          const sub = mockEnsembleStatus$.subscribe((value) => callback(value));
          return () => sub.unsubscribe();
        }
        return () => {};
      }
    );
  });

  describe("kinesisEnsemble", () => {
    it("emits Kinesis events from the underlying transport", (done) => {
      neurosity
        .kinesisEnsemble({ label: "leftArm" })
        .pipe(take(1))
        .subscribe({
          next: (k) => {
            expect(k.metric).toBe("kinesis");
            expect(k.label).toBe("leftArm");
            expect(k.probability).toBe(0.81);
            done();
          },
          error: done
        });
    });

    it("writes the ensemble config to a per-session document before subscribing", (done) => {
      neurosity
        .kinesisEnsemble({
          label: "leftArm",
          mode: "manual",
          classifierIds: ["clf-a", "clf-b"],
          refitIntervalSecs: 90,
          spectralLearning: true
        })
        .pipe(take(1))
        .subscribe({
          next: () => {
            const sessionWrite = firestoreWrites.find((w) =>
              w.path.includes("ensembleSessions")
            );
            expect(sessionWrite).toBeDefined();
            expect(sessionWrite!.data).toMatchObject({
              label: "leftArm",
              mode: "manual",
              classifierIds: ["clf-a", "clf-b"],
              refitIntervalSecs: 90,
              spectralLearning: true,
              deviceId: testDeviceId
            });
            done();
          },
          error: done
        });
    });
  });

  describe("kinesisEnsembleStatus", () => {
    it("emits monotonically increasing lastRefitAt; donorCount matches the bundle", (done) => {
      const received: EnsembleStatus[] = [];

      const sub = neurosity.kinesisEnsembleStatus().subscribe({
        next: (status) => {
          received.push(status);
          if (received.length === 3) {
            sub.unsubscribe();
            for (let i = 1; i < received.length; i++) {
              expect(received[i].lastRefitAt).toBeGreaterThanOrEqual(
                received[i - 1].lastRefitAt
              );
            }
            expect(received[received.length - 1].donorCount).toBe(8);
            done();
          }
        },
        error: done
      });

      mockEnsembleStatus$.next({
        active: true,
        donorCount: 7,
        personalizationScore: 0.5,
        lastRefitAt: 2_000,
        currentRefitIntervalSecs: 60
      });
      mockEnsembleStatus$.next({
        active: true,
        donorCount: 8,
        personalizationScore: 0.6,
        lastRefitAt: 3_000,
        currentRefitIntervalSecs: 60
      });
    });
  });

  describe("contributeClassifier", () => {
    it("flips sharingEnabled true and stamps sharedAt when share: true", async () => {
      await neurosity.contributeClassifier({
        classifierId: "clf-1",
        share: true
      });

      const write = firestoreWrites.find((w) => w.path === "memories/clf-1");
      expect(write).toBeDefined();
      expect(write!.op).toBe("updateDoc");
      expect(write!.data).toMatchObject({
        sharingEnabled: true,
        retiredAt: null,
        retirementReason: null
      });
      // sharedAt is a server-timestamp sentinel — presence is enough.
      expect("sharedAt" in write!.data).toBe(true);
    });

    it("triggers revoke (stamps retiredAt + retirementReason) when share: false", async () => {
      await neurosity.contributeClassifier({
        classifierId: "clf-1",
        share: false
      });

      const write = firestoreWrites.find((w) => w.path === "memories/clf-1");
      expect(write).toBeDefined();
      expect(write!.op).toBe("updateDoc");
      expect(write!.data).toMatchObject({
        sharingEnabled: false,
        retirementReason: "user_revoked"
      });
      expect("retiredAt" in write!.data).toBe(true);
    });
  });

  describe("myClassifiers", () => {
    it("reflects updates within one transport tick", (done) => {
      const received: MyClassifier[][] = [];

      const sub = neurosity.myClassifiers().subscribe({
        next: (list) => {
          received.push(list);
          if (received.length === 2) {
            sub.unsubscribe();
            expect(received[0]).toHaveLength(1);
            expect(received[1]).toHaveLength(2);
            expect(received[1][1].id).toBe("clf-b");
            done();
          }
        },
        error: done
      });

      // First snapshot.
      setTimeout(() => {
        myClassifiersSnapshotPump?.([
          {
            id: "clf-a",
            label: "leftArm",
            trainedAt: 1,
            repCount: 12,
            sharingEnabled: false,
            passedGate: null,
            gateScore: null
          }
        ]);

        // Second snapshot — single transport tick later.
        myClassifiersSnapshotPump?.([
          {
            id: "clf-a",
            label: "leftArm",
            trainedAt: 1,
            repCount: 12,
            sharingEnabled: true,
            passedGate: true,
            gateScore: 0.82
          },
          {
            id: "clf-b",
            label: "push",
            trainedAt: 2,
            repCount: 30,
            sharingEnabled: false,
            passedGate: null,
            gateScore: null
          }
        ]);
      }, 0);
    });
  });

  describe("listEnsembles", () => {
    it("is hardware-filtered (rejects entries whose hardware.modelId differs from device)", async () => {
      listEnsemblesFixture = [
        {
          id: "ens-match",
          name: "Crown-default-leftArm",
          classifierCount: 12,
          kind: "system_curated",
          hardware: { modelId: "crown", sampleRate: 256, channels: mockDeviceInfo.channelNames },
          updatedAt: 1
        },
        {
          id: "ens-wrong-model",
          name: "Notion-leftArm",
          classifierCount: 5,
          kind: "system_curated",
          hardware: { modelId: "notion-2", sampleRate: 256, channels: mockDeviceInfo.channelNames },
          updatedAt: 1
        }
      ];

      const results = await neurosity.listEnsembles({ label: "leftArm" });

      expect(results.map((r) => r.id)).toEqual(["ens-match"]);
    });
  });
});
