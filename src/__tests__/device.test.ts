import { Neurosity } from "../Neurosity";
import { firstValueFrom, of, BehaviorSubject, take } from "rxjs";
import { DeviceInfo } from "../types/deviceInfo";
import { STATUS, SLEEP_MODE_REASON, DeviceStatus } from "../types/status";
import { SignalQuality } from "../types/signalQuality";

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
    private _deviceInfo: DeviceInfo = {
      deviceId: "test-device-id",
      deviceNickname: "Test Device",
      channelNames: ["CH1", "CH2"],
      channels: 2,
      samplingRate: 250,
      manufacturer: "Neurosity",
      model: "Crown",
      modelName: "Crown",
      modelVersion: "v1",
      apiVersion: "1.0.0",
      osVersion: "1.0.0",
      emulator: false
    };
    private _selectedDevice = new BehaviorSubject<
      DeviceInfo | null | undefined
    >(this._deviceInfo);
    private _deviceStatus = new BehaviorSubject<DeviceStatus>({
      state: STATUS.ONLINE,
      charging: false,
      battery: 100,
      sleepMode: false,
      sleepModeReason: null,
      lastHeartbeat: Date.now(),
      ssid: "test-network"
    });
    private _signalQuality = new BehaviorSubject<SignalQuality>({
      CH1: {
        standardDeviation: 0.1,
        status: "good"
      },
      CH2: {
        standardDeviation: 0.1,
        status: "good"
      }
    });

    constructor(options: any) {
      this.options = options;
    }

    getInfo = jest.fn().mockResolvedValue(this._deviceInfo);

    selectDevice = jest
      .fn()
      .mockImplementation(
        async (selector: (devices: DeviceInfo[]) => DeviceInfo) => {
          try {
            const selectedDevice = selector([this._deviceInfo]);
            this._selectedDevice.next(selectedDevice);
            return selectedDevice;
          } catch (error) {
            this._selectedDevice.next(null);
            throw error;
          }
        }
      );

    didSelectDevice = jest.fn().mockResolvedValue(true);

    onDeviceChange = jest
      .fn()
      .mockReturnValue(this._selectedDevice.asObservable());

    status = jest.fn().mockReturnValue(this._deviceStatus.asObservable());

    signalQuality = jest
      .fn()
      .mockReturnValue(this._signalQuality.asObservable());

    osVersion = jest.fn().mockReturnValue(of("1.0.0"));

    metrics = {
      subscribe: jest.fn().mockImplementation((subscription) => {
        return { id: "test-id", ...subscription };
      }),
      on: jest.fn().mockImplementation((subscription, callback) => {
        if (subscription.metric === "signalQuality") {
          const sub = this._signalQuality.subscribe(callback);
          return () => sub.unsubscribe();
        }
        return () => {};
      })
    };

    addDevice = jest.fn().mockImplementation(async (deviceId: string) => {
      if (deviceId === "invalid-id") {
        throw new Error("Invalid device ID");
      }
      return Promise.resolve();
    });

    removeDevice = jest.fn().mockImplementation(async (deviceId: string) => {
      if (deviceId === "invalid-id") {
        throw new Error("Invalid device ID");
      }
      return Promise.resolve();
    });

    transferDevice = jest
      .fn()
      .mockImplementation(
        async (options: { deviceId: string; recipientsUserId: string }) => {
          if (
            options.deviceId === "invalid-id" ||
            options.recipientsUserId === "invalid-user"
          ) {
            throw new Error("Invalid transfer parameters");
          }
          return Promise.resolve();
        }
      );

    onUserDevicesChange = jest.fn().mockReturnValue(of([this._deviceInfo]));

    // Helper methods for tests
    _updateDeviceStatus(status: Partial<DeviceStatus>) {
      this._deviceStatus.next({
        ...this._deviceStatus.value,
        ...status
      });
    }

    _updateSignalQuality(quality: SignalQuality) {
      this._signalQuality.next(quality);
    }
  }

  return {
    ...originalModule,
    CloudClient: jest
      .fn()
      .mockImplementation((options) => new MockCloudClient(options))
  };
});

describe("Device Management", () => {
  let neurosity: Neurosity;
  let cloudClient: any;
  const testDeviceId = "test-device-id";

  beforeEach(() => {
    neurosity = new Neurosity({
      deviceId: testDeviceId,
      emulator: true
    });
    cloudClient = (neurosity as any).cloudClient;
  });

  describe("Device Information", () => {
    it("should get device info", async () => {
      const info = await neurosity.getInfo();
      expect(info).toBeDefined();
      expect(info.deviceId).toBe(testDeviceId);
      expect(info.manufacturer).toBe("Neurosity");
      expect(info.model).toBe("Crown");
    });

    it("should get device status", async () => {
      const status = await firstValueFrom(neurosity.status());
      expect(status).toBeDefined();
      expect(status.state).toBe(STATUS.ONLINE);
      expect(status.charging).toBe(false);
      expect(status.battery).toBe(100);
      expect(status.sleepMode).toBe(false);
      expect(status.ssid).toBe("test-network");
    });

    it("should get signal quality", async () => {
      const quality = await firstValueFrom(neurosity.signalQuality());
      expect(quality).toBeDefined();
      expect(quality.CH1.status).toBe("good");
      expect(quality.CH1.standardDeviation).toBe(0.1);
    });

    it("should get OS version", async () => {
      const version = await firstValueFrom(neurosity.osVersion());
      expect(version).toBeDefined();
      expect(version).toBe("1.0.0");
    });

    it("should handle device status changes", (done) => {
      const newStatus: Partial<DeviceStatus> = {
        state: STATUS.ONLINE,
        charging: true,
        battery: 80,
        sleepMode: true,
        sleepModeReason: SLEEP_MODE_REASON.CHARGING
      };

      neurosity.status().subscribe({
        next: (status) => {
          if (status.charging === true) {
            expect(status.battery).toBe(80);
            expect(status.sleepMode).toBe(true);
            expect(status.sleepModeReason).toBe(SLEEP_MODE_REASON.CHARGING);
            done();
          }
        },
        error: done
      });

      cloudClient._updateDeviceStatus(newStatus);
    });

    it("should handle signal quality changes", (done) => {
      const newQuality: SignalQuality = {
        CH1: {
          standardDeviation: 0.5,
          status: "bad"
        },
        CH2: {
          standardDeviation: 0.5,
          status: "bad"
        }
      };

      cloudClient._updateSignalQuality(newQuality);

      neurosity
        .signalQuality()
        .pipe(take(1))
        .subscribe({
          next: (quality) => {
            expect(quality.CH1.standardDeviation).toBe(0.5);
            expect(quality.CH2.status).toBe("bad");
            done();
          },
          error: done
        });
    }, 10000);
  });

  describe("Device Selection", () => {
    it("should select device", async () => {
      await expect(
        neurosity.selectDevice((devices) => {
          const device = devices.find((d) => d.deviceId === testDeviceId);
          if (!device) throw new Error("Device not found");
          return device;
        })
      ).resolves.not.toThrow();

      const deviceInfo = await neurosity.getInfo();
      expect(deviceInfo.deviceId).toBe(testDeviceId);
    });

    it("should handle device selection failure", async () => {
      await expect(
        neurosity.selectDevice(() => {
          throw new Error("Device not found");
        })
      ).rejects.toThrow("Device not found");
    });

    it("should monitor device changes", (done) => {
      neurosity
        .onDeviceChange()
        .pipe(take(1))
        .subscribe({
          next: (deviceInfo) => {
            expect(deviceInfo).toBeDefined();
            expect(deviceInfo.deviceId).toBe(testDeviceId);
            done();
          },
          error: done
        });
    });
  });

  describe("Device Management", () => {
    it("should add device", async () => {
      await expect(neurosity.addDevice(testDeviceId)).resolves.not.toThrow();
    });

    it("should handle invalid device ID when adding", async () => {
      await expect(neurosity.addDevice("invalid-id")).rejects.toThrow(
        "Invalid device ID"
      );
    });

    it("should remove device", async () => {
      await expect(neurosity.removeDevice(testDeviceId)).resolves.not.toThrow();
    });

    it("should handle invalid device ID when removing", async () => {
      await expect(neurosity.removeDevice("invalid-id")).rejects.toThrow(
        "Invalid device ID"
      );
    });

    it("should transfer device", async () => {
      const transferOptions = {
        deviceId: testDeviceId,
        recipientsUserId: "target-user-id"
      };
      await expect(
        neurosity.transferDevice(transferOptions)
      ).resolves.not.toThrow();
    });

    it("should handle invalid transfer parameters", async () => {
      const invalidOptions = {
        deviceId: "invalid-id",
        recipientsUserId: "invalid-user"
      };
      await expect(neurosity.transferDevice(invalidOptions)).rejects.toThrow(
        "Invalid transfer parameters"
      );
    });

    it("should monitor user devices changes", async () => {
      const devices = await firstValueFrom(neurosity.onUserDevicesChange());
      expect(devices).toBeDefined();
      expect(Array.isArray(devices)).toBe(true);
      expect(devices[0].deviceId).toBe(testDeviceId);
    });
  });
});
