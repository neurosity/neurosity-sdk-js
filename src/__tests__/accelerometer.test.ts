import { Neurosity } from "../Neurosity";
import { BehaviorSubject, Subscription } from "rxjs";
import { take } from "rxjs/operators";
import { DeviceInfo } from "../types/deviceInfo";
import { STATUS } from "../types/status";
import { DeviceStatus } from "../types/status";
import { Accelerometer } from "../types/accelerometer";

// Mock CloudClient
jest.mock("../api", () => {
  const originalModule = jest.requireActual("../api");

  class MockCloudClient {
    public user = null;
    public userClaims = { scopes: ["brainwaves"] };
    protected options: any;
    protected firebaseApp: any;
    protected firebaseUser: any;
    protected firebaseDevice: any;
    public subscriptionManager = {
      add: jest.fn(),
      remove: jest.fn(),
      removeAll: jest.fn()
    };

    private _accelerometerData = new BehaviorSubject<Accelerometer>({
      x: 0.1,
      y: -0.2,
      z: 9.8,
      timestamp: Date.now(),
      acceleration: 9.8,
      inclination: 0,
      orientation: 0,
      pitch: 0,
      roll: 0
    });

    public bluetoothClient = {
      accelerometer: jest.fn().mockReturnValue(this._accelerometerData),
      connection: jest.fn().mockReturnValue(new BehaviorSubject("connected"))
    };

    private _selectedDevice = new BehaviorSubject<
      DeviceInfo | null | undefined
    >({
      deviceId: "test-device-id",
      deviceNickname: "Test Device",
      channelNames: ["CH1", "CH2"],
      channels: 2,
      samplingRate: 250,
      manufacturer: "Neurosity",
      model: "Crown",
      modelName: "Crown",
      modelVersion: "3",
      apiVersion: "1.0.0",
      osVersion: "16.0.0",
      emulator: false
    });

    constructor(options: any) {
      this.options = options;
    }

    getInfo = jest.fn().mockResolvedValue(this._selectedDevice.value);
    selectDevice = jest
      .fn()
      .mockImplementation(async () => this._selectedDevice.value);
    didSelectDevice = jest.fn().mockResolvedValue(true);
    onDeviceChange = jest.fn().mockReturnValue(this._selectedDevice);

    status = jest.fn().mockReturnValue(
      new BehaviorSubject<DeviceStatus>({
        state: STATUS.ONLINE,
        charging: false,
        battery: 100,
        sleepMode: false,
        sleepModeReason: null,
        lastHeartbeat: Date.now(),
        ssid: "test-network"
      })
    );

    osVersion = jest.fn().mockReturnValue(new BehaviorSubject("16.0.0"));

    metrics = {
      subscribe: jest.fn().mockImplementation(() => {
        const subscription = new Subscription();
        subscription.add(this._accelerometerData.subscribe());
        return subscription;
      }),
      on: jest.fn().mockImplementation((subscription, callback) => {
        const sub = this._accelerometerData.subscribe(callback);
        return () => sub.unsubscribe();
      })
    };
  }

  return {
    ...originalModule,
    CloudClient: jest
      .fn()
      .mockImplementation((options) => new MockCloudClient(options))
  };
});

describe("Accelerometer", () => {
  let neurosity: Neurosity;
  const testDeviceId = "test-device-id";

  beforeEach(() => {
    neurosity = new Neurosity({
      deviceId: testDeviceId,
      emulator: true
    });
  });

  describe("Accelerometer Data", () => {
    it("should get accelerometer readings", (done) => {
      neurosity
        .accelerometer()
        .pipe(take(1))
        .subscribe({
          next: (accel) => {
            expect(accel).toBeDefined();
            expect(typeof accel.x).toBe("number");
            expect(typeof accel.y).toBe("number");
            expect(typeof accel.z).toBe("number");
            expect(accel.timestamp).toBeDefined();

            // Check for reasonable values
            expect(accel.x).toBe(0.1);
            expect(accel.y).toBe(-0.2);
            expect(accel.z).toBe(9.8); // Approximately Earth's gravity
            done();
          },
          error: done
        });
    });

    it("should provide continuous accelerometer updates", (done) => {
      neurosity
        .accelerometer()
        .pipe(take(1))
        .subscribe({
          next: (reading) => {
            expect(reading.x).toBeDefined();
            expect(reading.y).toBeDefined();
            expect(reading.z).toBeDefined();
            expect(reading.timestamp).toBeDefined();
            done();
          },
          error: done
        });
    });
  });

  describe("Error Handling", () => {
    it("should handle device offline state", (done) => {
      // Mock device going offline
      const cloudClient = (neurosity as any).cloudClient;
      cloudClient.status.mockReturnValueOnce(
        new BehaviorSubject<DeviceStatus>({
          state: STATUS.OFFLINE,
          charging: false,
          battery: 100,
          sleepMode: false,
          sleepModeReason: null,
          lastHeartbeat: Date.now(),
          ssid: "test-network"
        })
      );

      neurosity.accelerometer().subscribe({
        error: (err) => {
          expect(err).toBeDefined();
          done();
        }
      });
    });
  });
});
