/// <reference types="node" />

import { describe, it } from "node:test";
import assert from "node:assert";
import { Neurosity } from "../Neurosity";
import { STREAMING_MODE } from "../types/streaming";
import { SDKOptions } from "../types/options";
import { Observable } from "rxjs";
import { DeviceInfo } from "../types/deviceInfo";
import { Epoch } from "../types/epoch";
import { firstValueFrom, take, of, ReplaySubject } from "rxjs";
import { STATUS } from "../types/status";
import { CloudClient } from "../api";

// Mock Firebase modules
jest.mock("../api/firebase", () => {
  const mockFirebaseApp = jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    useEmulator: jest.fn()
  }));
  mockFirebaseApp.prototype.constructor = mockFirebaseApp;

  const mockFirebaseUser = jest.fn().mockImplementation(() => ({
    login: jest.fn().mockResolvedValue({}),
    logout: jest.fn().mockResolvedValue({}),
    onAuthStateChanged: jest.fn().mockReturnValue(of(null)),
    onUserClaimsChange: jest.fn().mockReturnValue(of({}))
  }));
  mockFirebaseUser.prototype.constructor = mockFirebaseUser;

  const mockFirebaseDevice = jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    getInfo: jest.fn().mockResolvedValue({}),
    selectDevice: jest.fn().mockResolvedValue({}),
    dispatchAction: jest.fn()
  }));
  mockFirebaseDevice.prototype.constructor = mockFirebaseDevice;

  return {
    FirebaseApp: mockFirebaseApp,
    FirebaseUser: mockFirebaseUser,
    FirebaseDevice: mockFirebaseDevice
  };
});

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
    private _selectedDevice = new ReplaySubject<DeviceInfo | null | undefined>(
      1
    );

    constructor(options: any) {
      this.options = options;
      this._selectedDevice.next(undefined);
    }

    login = jest.fn().mockResolvedValue({});
    logout = jest.fn().mockResolvedValue({});
    getInfo = jest.fn().mockResolvedValue({});
    selectDevice = jest.fn().mockResolvedValue({});
    didSelectDevice = jest.fn().mockResolvedValue(true);
    onDeviceChange = jest.fn().mockReturnValue(
      of({
        deviceId: "test-device-id",
        status: STATUS.ONLINE
      })
    );
    osVersion = jest.fn().mockReturnValue(of("1.0.0"));
    status = jest.fn().mockReturnValue(of({ state: STATUS.ONLINE }));
    metrics = {
      subscribe: jest.fn().mockReturnValue(of({})),
      on: jest.fn().mockImplementation((subscription, callback) => {
        callback({});
        return jest.fn();
      }),
      unsubscribe: jest.fn()
    };
  }

  return {
    ...originalModule,
    CloudClient: jest
      .fn()
      .mockImplementation((options) => new MockCloudClient(options))
  };
});

describe("Neurosity", () => {
  let neurosity: Neurosity;
  const testDeviceId = "test-device-id";
  const testEmail = "test@example.com";
  const testPassword = "test-password";

  beforeEach(() => {
    jest.clearAllMocks();
    neurosity = new Neurosity({
      deviceId: testDeviceId,
      emulator: true
    });

    // Mock _osHasBluetoothSupport to return false to avoid Bluetooth-related code paths
    neurosity["_osHasBluetoothSupport"] = jest.fn().mockReturnValue(of(false));
  });

  describe("Initialization", () => {
    test("should initialize with default options when no options provided", () => {
      const instance = new Neurosity();
      expect(instance).toBeDefined();
    });

    test("should initialize with provided deviceId", () => {
      const instance = new Neurosity({ deviceId: testDeviceId });
      expect(instance).toBeDefined();
    });

    test("should initialize with custom options", () => {
      const instance = new Neurosity({
        deviceId: testDeviceId,
        emulator: true,
        timesync: false
      });
      expect(instance).toBeDefined();
    });
  });

  describe("Authentication", () => {
    test("should handle login with email and password", async () => {
      await expect(
        neurosity.login({ email: testEmail, password: testPassword })
      ).resolves.not.toThrow();
    });

    test("should handle logout", async () => {
      await expect(neurosity.logout()).resolves.not.toThrow();
    });
  });

  describe("Device Management", () => {
    test("should get device info", async () => {
      const mockInfo: DeviceInfo = {
        deviceId: testDeviceId,
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

      (neurosity["cloudClient"].getInfo as jest.Mock).mockResolvedValueOnce(
        mockInfo
      );
      const info = await neurosity.getInfo();
      expect(info).toEqual(mockInfo);
    });

    test("should handle device selection", async () => {
      const mockDevice: DeviceInfo = {
        deviceId: testDeviceId,
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

      (
        neurosity["cloudClient"].selectDevice as jest.Mock
      ).mockResolvedValueOnce(mockDevice);
      await expect(
        neurosity.selectDevice((devices) => {
          const device = devices.find((d) => d.deviceId === testDeviceId);
          if (!device) {
            throw new Error("Device not found");
          }
          return device;
        })
      ).resolves.not.toThrow();
    });
  });

  describe("Streaming", () => {
    test("should stream brainwaves", async () => {
      const mockRawData = {
        data: [
          [1, 2, 3, 4, 5, 6, 7, 8],
          [9, 10, 11, 12, 13, 14, 15, 16]
        ],
        info: {
          samplingRate: 256,
          startTime: Date.now()
        }
      };

      // Mock the getCloudMetric function to return our mock data
      neurosity["_getCloudMetricDependencies"] = jest.fn().mockReturnValue({
        options: {
          deviceId: testDeviceId,
          emulator: true
        },
        cloudClient: neurosity["cloudClient"],
        onDeviceChange: neurosity["cloudClient"].onDeviceChange,
        status: neurosity["cloudClient"].status,
        getCloudMetric: jest.fn().mockReturnValue(of(mockRawData))
      });

      const brainwaves = await firstValueFrom(
        neurosity.brainwaves("raw").pipe(take(1))
      );

      expect(brainwaves).toBeDefined();
      if ("data" in brainwaves) {
        expect(Array.isArray(brainwaves.data)).toBe(true);
        expect(brainwaves.data.length).toBe(2);
        expect(brainwaves.data[0].length).toBe(8);
      }
    });
  });
});
