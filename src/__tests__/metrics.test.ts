import { Neurosity } from "../Neurosity";
import { BehaviorSubject, Observable, of, throwError } from "rxjs";
import { take } from "rxjs/operators";
import { DeviceInfo } from "../types/deviceInfo";
import { STATUS } from "../types/status";
import { DeviceStatus } from "../types/status";
import { PendingSubscription, Subscription } from "../types/subscriptions";

// Mock CloudClient
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
      scopes: ["focus", "kinesis"]
    }
  };

  return {
    CloudClient: jest.fn().mockImplementation(() => mockCloudClient)
  };
});

const testDeviceId = "mock-device-id";

describe("Metrics", () => {
  let neurosity: Neurosity;
  let mockFocusData: BehaviorSubject<any>;
  let mockKinesisData: BehaviorSubject<any>;
  let cloudClient: any;

  beforeEach(() => {
    neurosity = new Neurosity({
      deviceId: testDeviceId,
      emulator: true
    });

    cloudClient = (neurosity as any).cloudClient;

    // Mock device info
    const mockDeviceInfo = {
      deviceId: testDeviceId,
      channelNames: ["CP3", "C3", "F5", "PO3", "PO4", "F6", "C4", "CP4"],
      samplingRate: 256,
      modelName: "crown",
      modelVersion: "v3"
    };

    // Mock device status
    const mockDeviceStatus: DeviceStatus = {
      state: STATUS.ONLINE,
      charging: false,
      battery: 100,
      sleepMode: false,
      sleepModeReason: null,
      lastHeartbeat: Date.now(),
      ssid: "test-network"
    };

    // Setup mock data
    mockFocusData = new BehaviorSubject({
      probability: 0.85,
      label: "focus",
      metric: "awareness",
      timestamp: Date.now()
    });

    mockKinesisData = new BehaviorSubject({
      probability: 0.75,
      label: "leftArm",
      metric: "kinesis",
      timestamp: Date.now()
    });

    // Mock cloud client methods
    cloudClient.onDeviceChange.mockReturnValue(of(mockDeviceInfo));
    cloudClient.status.mockReturnValue(of(mockDeviceStatus));
    cloudClient.osVersion.mockReturnValue(of("16.0.0"));

    // Setup metrics subscription behavior
    cloudClient.metrics.subscribe.mockImplementation(
      (subscription: PendingSubscription) => {
        return { id: "test-id", ...subscription };
      }
    );

    cloudClient.metrics.on.mockImplementation(
      (subscription: Subscription, callback: (value: any) => void) => {
        if (subscription.metric === "awareness") {
          const sub = mockFocusData.subscribe((value) => callback(value));
          return () => sub.unsubscribe();
        } else if (subscription.metric === "kinesis") {
          const sub = mockKinesisData.subscribe((value) => callback(value));
          return () => sub.unsubscribe();
        }
        return () => {};
      }
    );
  });

  describe("Focus", () => {
    it("should get focus metrics", (done) => {
      neurosity
        .focus()
        .pipe(take(1))
        .subscribe({
          next: (focus) => {
            expect(focus).toBeDefined();
            expect(focus.probability).toBe(0.85);
            expect(focus.label).toBe("focus");
            expect(focus.metric).toBe("awareness");
            expect(focus.timestamp).toBeDefined();
            done();
          },
          error: done
        });
    });
  });

  describe("Kinesis", () => {
    it("should get kinesis metrics", (done) => {
      neurosity
        .kinesis("leftArm")
        .pipe(take(1))
        .subscribe({
          next: (kinesis) => {
            expect(kinesis).toBeDefined();
            expect(kinesis.probability).toBe(0.75);
            expect(kinesis.label).toBe("leftArm");
            expect(kinesis.metric).toBe("kinesis");
            expect(kinesis.timestamp).toBeDefined();
            done();
          },
          error: done
        });
    });
  });

  describe("Error Handling", () => {
    it("should handle device offline state", (done) => {
      // Mock device going offline
      cloudClient.onDeviceChange.mockReturnValue(
        of({
          deviceId: testDeviceId,
          channelNames: ["CP3", "C3", "F5", "PO3", "PO4", "F6", "C4", "CP4"],
          samplingRate: 256,
          modelName: "crown",
          modelVersion: "v3"
        })
      );

      cloudClient.status.mockReturnValue(
        throwError(() => new Error("Device is offline"))
      );

      neurosity
        .focus()
        .pipe(take(1))
        .subscribe({
          next: () => {
            done(new Error("Should not emit when device is offline"));
          },
          error: (err) => {
            expect(err).toBeDefined();
            expect(err.message).toContain("offline");
            done();
          }
        });
    });
  });
});
