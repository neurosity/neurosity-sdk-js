/// <reference types="node" />

import { of, firstValueFrom } from "rxjs";
import { Neurosity } from "../Neurosity";
import { STATUS } from "../types/status";
import { STREAMING_MODE } from "../types/streaming";

// Mock Firebase modules
jest.mock("../api/firebase", () => {
  const mockFirebaseApp = jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    useEmulator: jest.fn()
  }));
  mockFirebaseApp.prototype.constructor = mockFirebaseApp;

  const mockFirebaseUser = jest.fn().mockImplementation(() => ({
    login: jest.fn().mockResolvedValue({ user: { uid: "test-uid" } }),
    logout: jest.fn().mockResolvedValue({}),
    onAuthStateChanged: jest.fn().mockReturnValue(of(null)),
    onUserClaimsChange: jest.fn().mockReturnValue(of({}))
  }));
  mockFirebaseUser.prototype.constructor = mockFirebaseUser;

  const mockFirebaseDevice = jest.fn().mockImplementation(() => ({
    disconnect: jest.fn().mockResolvedValue(undefined),
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

describe("Neurosity", () => {
  let neurosity: Neurosity;
  const testDeviceId = "test-device-id";
  const options = {
    deviceId: testDeviceId,
    emulator: true
  };

  beforeEach(() => {
    neurosity = new Neurosity(options);
    // Mock cloudClient with all necessary methods
    neurosity["cloudClient"] = {
      user: { uid: "test-uid" },
      userClaims: { scopes: "all" },
      options: options,
      disconnect: jest.fn().mockResolvedValue(undefined),
      login: jest.fn().mockResolvedValue({ user: { uid: "test-uid" } }),
      logout: jest.fn().mockResolvedValue({}),
      status: jest.fn().mockReturnValue(of({ state: STATUS.ONLINE })),
      osVersion: jest.fn().mockReturnValue(of("1.0.0")),
      onDeviceChange: jest
        .fn()
        .mockReturnValue(of({ deviceId: testDeviceId, status: STATUS.ONLINE }))
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Constructor", () => {
    it("should create instance with deviceId", () => {
      expect(neurosity).toBeDefined();
      expect(neurosity["options"].deviceId).toBe(testDeviceId);
    });

    it("should create instance with emulator option", () => {
      expect(neurosity["options"].emulator).toBe(true);
    });
  });

  describe("Connection", () => {
    it("should initialize cloud client", () => {
      expect(neurosity["cloudClient"]).toBeDefined();
    });

    it("should handle disconnect", async () => {
      await neurosity.disconnect();
      expect(neurosity["cloudClient"].disconnect).toHaveBeenCalled();
    }, 10000); // Increase timeout to 10s
  });

  describe("Authentication", () => {
    const testEmail = "test@example.com";
    const testPassword = "password123";

    it("should handle login", async () => {
      const result = await neurosity.login({
        email: testEmail,
        password: testPassword
      });
      expect(result).toBeDefined();
      expect((result as any).user).toBeDefined();
      expect((result as any).user.uid).toBe("test-uid");
    });

    it("should handle logout", async () => {
      const result = await neurosity.logout();
      expect(result).toBeDefined();
    });
  });

  describe("Device Status", () => {
    it("should get device status", async () => {
      // Mock streaming state to ensure we're using WiFi mode
      neurosity["streamingMode$"].next(STREAMING_MODE.WIFI_ONLY);

      // Mock device status
      neurosity["cloudClient"].status = jest
        .fn()
        .mockReturnValue(of({ state: STATUS.ONLINE }));

      // Mock device change
      neurosity["cloudClient"].onDeviceChange = jest
        .fn()
        .mockReturnValue(of({ deviceId: testDeviceId, status: STATUS.ONLINE }));

      // Mock bluetooth support
      neurosity["_osHasBluetoothSupport"] = jest
        .fn()
        .mockReturnValue(of(false));

      const status = await firstValueFrom(neurosity.status());
      expect(status).toBeDefined();
      expect(status?.state).toBe(STATUS.ONLINE);
    }, 10000); // Increase timeout to 10s
  });
});
