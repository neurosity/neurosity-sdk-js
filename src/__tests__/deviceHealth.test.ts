import { Neurosity } from "../Neurosity";
import { BehaviorSubject, of, throwError } from "rxjs";
import { take } from "rxjs/operators";
import { STATUS, DeviceStatus } from "../types/status";
import { PendingSubscription, Subscription } from "../types/subscriptions";
import { DeviceHealth } from "../types/deviceHealth";

// Mock CloudClient — mirrors metrics.test.ts setup.
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
    }
  };

  return {
    CloudClient: jest.fn().mockImplementation(() => mockCloudClient)
  };
});

const testDeviceId = "mock-device-id";

describe("deviceHealth", () => {
  let neurosity: Neurosity;
  let mockHealth$: BehaviorSubject<DeviceHealth>;
  let cloudClient: any;

  beforeEach(() => {
    neurosity = new Neurosity({
      deviceId: testDeviceId,
      emulator: true
    });

    cloudClient = (neurosity as any).cloudClient;

    const mockDeviceInfo = {
      deviceId: testDeviceId,
      channelNames: ["CP3", "C3", "F5", "PO3", "PO4", "F6", "C4", "CP4"],
      samplingRate: 256,
      modelName: "crown",
      modelVersion: "v3"
    };

    const mockDeviceStatus: DeviceStatus = {
      state: STATUS.ONLINE,
      charging: false,
      battery: 100,
      sleepMode: false,
      sleepModeReason: null,
      lastHeartbeat: Date.now(),
      ssid: "test-network"
    };

    mockHealth$ = new BehaviorSubject<DeviceHealth>({
      cpuLoadPerCore: [12.5, 15.0, 9.3, 11.1],
      memFreeMB: 612,
      memFreePct: 0.31,
      thermalC: 58.4,
      thermalThrottled: false,
      ts: Date.now()
    });

    cloudClient.onDeviceChange.mockReturnValue(of(mockDeviceInfo));
    cloudClient.status.mockReturnValue(of(mockDeviceStatus));
    cloudClient.osVersion.mockReturnValue(of("16.0.0"));

    cloudClient.metrics.subscribe.mockImplementation(
      (subscription: PendingSubscription) => {
        return { id: "device-health-sub", ...subscription };
      }
    );

    cloudClient.metrics.on.mockImplementation(
      (subscription: Subscription, callback: (value: any) => void) => {
        if (subscription.metric === "deviceHealth") {
          const sub = mockHealth$.subscribe((value) => callback(value));
          return () => sub.unsubscribe();
        }
        return () => {};
      }
    );
  });

  it("forwards from the deviceHealth metric stream", (done) => {
    neurosity
      .deviceHealth()
      .pipe(take(1))
      .subscribe({
        next: (health) => {
          expect(health).toBeDefined();
          expect(Array.isArray(health.cpuLoadPerCore)).toBe(true);
          expect(health.cpuLoadPerCore).toHaveLength(4);
          expect(typeof health.memFreeMB).toBe("number");
          expect(typeof health.memFreePct).toBe("number");
          expect(typeof health.thermalC).toBe("number");
          expect(typeof health.thermalThrottled).toBe("boolean");
          expect(typeof health.ts).toBe("number");
          done();
        },
        error: done
      });
  });

  it("subscribes under the deviceHealth metric label", (done) => {
    neurosity
      .deviceHealth()
      .pipe(take(1))
      .subscribe({
        next: () => {
          expect(cloudClient.metrics.subscribe).toHaveBeenCalledWith(
            expect.objectContaining({
              metric: "deviceHealth"
            })
          );
          done();
        },
        error: done
      });
  });

  it("propagates errors when the device is offline", (done) => {
    cloudClient.status.mockReturnValue(
      throwError(() => new Error("Device is offline"))
    );

    neurosity
      .deviceHealth()
      .pipe(take(1))
      .subscribe({
        next: () => done(new Error("Should not emit when offline")),
        error: (err) => {
          expect(err.message).toContain("offline");
          done();
        }
      });
  });
});
