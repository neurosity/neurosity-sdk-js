import { Neurosity } from "../Neurosity";
import { BehaviorSubject, of } from "rxjs";
import { take } from "rxjs/operators";
import { STATUS, DeviceStatus } from "../types/status";
import { PendingSubscription, Subscription } from "../types/subscriptions";

jest.mock("../api/index", () => {
  const mockSubscriptions = new Map();
  const mockListeners = new Map();
  let subscriptionId = 0;

  const mockCloudClient = {
    login: jest.fn(),
    logout: jest.fn(),
    onAuthStateChanged: jest.fn(),
    onDeviceChange: jest.fn(),
    status: jest.fn(),
    metrics: {
      on: jest.fn(
        (subscription: Subscription, callback: (value: any) => void) => {
          const listener = (value: any) => callback(value);
          const key = `${subscription.id}-${
            subscription.metric
          }-${subscription.labels.join(",")}`;
          if (!mockListeners.has(key)) {
            mockListeners.set(key, []);
          }
          mockListeners.get(key).push(listener);
          return listener;
        }
      ),
      subscribe: jest.fn((subscription: PendingSubscription) => {
        const id = `subscription-${subscriptionId++}`;
        const sub = { id, ...subscription };
        mockSubscriptions.set(id, sub);
        return sub;
      }),
      unsubscribe: jest.fn(
        (subscription: Subscription, listener: (value: any) => void) => {
          const key = `${subscription.id}-${
            subscription.metric
          }-${subscription.labels.join(",")}`;
          const listeners = mockListeners.get(key) || [];
          const index = listeners.indexOf(listener);
          if (index > -1) {
            listeners.splice(index, 1);
          }
          mockSubscriptions.delete(subscription.id);
        }
      )
    },
    osVersion: jest.fn(),
    userClaims: {
      scopes: ["signal-quality"]
    }
  };

  return {
    CloudClient: jest.fn().mockImplementation(() => mockCloudClient)
  };
});

const testDeviceId = "mock-device-id";

describe("SignalQualityV2", () => {
  let neurosity: Neurosity;
  let mockSignalQualityV2Data: BehaviorSubject<any>;
  let cloudClient: any;

  beforeEach(() => {
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

    mockSignalQualityV2Data = new BehaviorSubject({
      timestamp: Date.now(),
      overall: {
        score: 0.85,
        standardDeviation: 5.2,
        spectrumSlope: -1.3,
        status: "adequate"
      },
      byChannel: {
        CP3: { score: 0.92, standardDeviation: 3.1, spectrumSlope: -1.5, status: "adequate" },
        C3: { score: 0.88, standardDeviation: 4.0, spectrumSlope: -1.2, status: "adequate" },
        F5: { score: 0.71, standardDeviation: 8.5, spectrumSlope: -0.8, status: "degraded" },
        PO3: { score: 0.90, standardDeviation: 3.5, spectrumSlope: -1.4, status: "adequate" },
        PO4: { score: 0.87, standardDeviation: 4.2, spectrumSlope: -1.3, status: "adequate" },
        F6: { score: 0.83, standardDeviation: 5.0, spectrumSlope: -1.1, status: "adequate" },
        C4: { score: 0.91, standardDeviation: 3.3, spectrumSlope: -1.5, status: "adequate" },
        CP4: { score: 0.89, standardDeviation: 3.8, spectrumSlope: -1.4, status: "adequate" }
      }
    });

    cloudClient.onDeviceChange.mockReturnValue(
      of({
        deviceId: testDeviceId,
        channelNames: ["CP3", "C3", "F5", "PO3", "PO4", "F6", "C4", "CP4"],
        samplingRate: 256,
        modelName: "crown",
        modelVersion: "v3"
      })
    );
    cloudClient.status.mockReturnValue(of(mockDeviceStatus));
    cloudClient.osVersion.mockReturnValue(of("17.0.0"));

    cloudClient.metrics.subscribe.mockImplementation(
      (subscription: PendingSubscription) => {
        return { id: "test-id", ...subscription };
      }
    );

    cloudClient.metrics.on.mockImplementation(
      (subscription: Subscription, callback: (value: any) => void) => {
        if (subscription.metric === "signalQualityV2") {
          const sub = mockSignalQualityV2Data.subscribe((value) =>
            callback(value)
          );
          return () => sub.unsubscribe();
        }
        return () => {};
      }
    );
  });

  it("should get signalQualityV2 with overall score", (done) => {
    neurosity
      .signalQualityV2()
      .pipe(take(1))
      .subscribe({
        next: (quality) => {
          expect(quality).toBeDefined();
          expect(quality.overall).toBeDefined();
          expect(quality.overall.score).toBe(0.85);
          done();
        },
        error: done
      });
  });

  it("should include per-channel scores with full SignalStatus fields", (done) => {
    neurosity
      .signalQualityV2()
      .pipe(take(1))
      .subscribe({
        next: (quality) => {
          expect(quality.byChannel).toBeDefined();
          expect(Object.keys(quality.byChannel)).toHaveLength(8);

          // Check full SignalStatus shape
          const cp3 = quality.byChannel.CP3;
          expect(cp3.score).toBe(0.92);
          expect(cp3.standardDeviation).toBe(3.1);
          expect(cp3.spectrumSlope).toBe(-1.5);
          expect(cp3.status).toBe("adequate");

          // Check degraded channel
          const f5 = quality.byChannel.F5;
          expect(f5.score).toBe(0.71);
          expect(f5.status).toBe("degraded");
          done();
        },
        error: done
      });
  });

  it("should include overall with standardDeviation and spectrumSlope", (done) => {
    neurosity
      .signalQualityV2()
      .pipe(take(1))
      .subscribe({
        next: (quality) => {
          expect(quality.overall.standardDeviation).toBe(5.2);
          expect(quality.overall.spectrumSlope).toBe(-1.3);
          expect(quality.overall.status).toBe("adequate");
          done();
        },
        error: done
      });
  });

  it("should include timestamp", (done) => {
    neurosity
      .signalQualityV2()
      .pipe(take(1))
      .subscribe({
        next: (quality) => {
          expect(quality.timestamp).toBeDefined();
          expect(typeof quality.timestamp).toBe("number");
          done();
        },
        error: done
      });
  });

  it("should emit updated values", (done) => {
    let count = 0;
    neurosity
      .signalQualityV2()
      .pipe(take(2))
      .subscribe({
        next: (quality) => {
          count++;
          if (count === 1) {
            expect(quality.overall.score).toBe(0.85);
            // Emit new value
            mockSignalQualityV2Data.next({
              timestamp: Date.now(),
              overall: { score: 0.42, standardDeviation: 12.0, spectrumSlope: -0.5, status: "degraded" },
              byChannel: {
                CP3: { score: 0.30, standardDeviation: 15.0, spectrumSlope: -0.3, status: "degraded" },
                C3: { score: 0.35, standardDeviation: 13.0, spectrumSlope: -0.4, status: "degraded" },
                F5: { score: 0.50, standardDeviation: 10.0, spectrumSlope: -0.6, status: "degraded" },
                PO3: { score: 0.45, standardDeviation: 11.0, spectrumSlope: -0.5, status: "degraded" },
                PO4: { score: 0.40, standardDeviation: 12.5, spectrumSlope: -0.4, status: "degraded" },
                F6: { score: 0.38, standardDeviation: 13.5, spectrumSlope: -0.3, status: "degraded" },
                C4: { score: 0.42, standardDeviation: 12.0, spectrumSlope: -0.5, status: "degraded" },
                CP4: { score: 0.44, standardDeviation: 11.5, spectrumSlope: -0.5, status: "degraded" }
              }
            });
          } else {
            expect(quality.overall.score).toBe(0.42);
            done();
          }
        },
        error: done
      });
  });

  it("should subscribe with atomic: true", () => {
    neurosity.signalQualityV2().pipe(take(1)).subscribe();

    expect(cloudClient.metrics.subscribe).toHaveBeenCalledWith(
      expect.objectContaining({
        metric: "signalQualityV2",
        atomic: true
      })
    );
  });
});
