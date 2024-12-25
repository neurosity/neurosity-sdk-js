import { Neurosity } from "../Neurosity";
import { firstValueFrom } from "rxjs";
import { EmailAndPassword } from "../types/credentials";
import { DeviceInfo } from "../types/deviceInfo";
import { Settings } from "../types/settings";
import { STATUS } from "../types/status";

describe("Device Management", () => {
  let neurosity: Neurosity;
  const testDeviceId = "test-device-id";
  const credentials: EmailAndPassword = {
    email: "test@example.com",
    password: "testPassword123"
  };

  beforeEach(() => {
    neurosity = new Neurosity({
      deviceId: testDeviceId,
      emulator: true
    });
  });

  afterEach(async () => {
    try {
      await neurosity.logout();
    } catch (error) {
      // Ignore logout errors in cleanup
    }
  });

  describe("Device Selection", () => {
    // TODO: Issue #XYZ - Device selection tests need to be implemented
    // These tests require proper mocking of device selection and state management
    it.skip("should select device by ID", async () => {
      await neurosity.login(credentials);
      const device = await neurosity.selectDevice(
        (devices: DeviceInfo[]) => devices[0]
      );
      expect(device).toBeDefined();
      expect(device.deviceId).toBe(testDeviceId);
    });

    it.skip("should handle invalid device ID", async () => {
      await neurosity.login(credentials);
      const invalidDeviceId = "invalid-device-id";
      const neurosity2 = new Neurosity({
        deviceId: invalidDeviceId,
        emulator: true
      });
      await expect(
        neurosity2.selectDevice((devices: DeviceInfo[]) => devices[0])
      ).rejects.toThrow();
    });
  });

  describe("Device Information", () => {
    // TODO: Issue #XYZ - Device information tests need to be implemented
    // These tests require proper mocking of device info responses
    it.skip("should get device info", async () => {
      await neurosity.login(credentials);
      const info = await firstValueFrom(neurosity.getInfo());
      expect(info).toBeDefined();
      expect((info as DeviceInfo).deviceId).toBe(testDeviceId);
      expect((info as DeviceInfo).model).toBeDefined();
      expect((info as DeviceInfo).osVersion).toBeDefined();
    });

    it.skip("should get device status", async () => {
      await neurosity.login(credentials);
      const status = await firstValueFrom(neurosity.status());
      expect(status).toBeDefined();
      expect(status.state).toBeDefined();
      expect(Object.values(STATUS)).toContain(status.state);
      expect(typeof status.charging).toBe("boolean");
      expect(typeof status.battery).toBe("number");
      expect(typeof status.sleepMode).toBe("boolean");
    });
  });

  describe("Device Settings", () => {
    // TODO: Issue #XYZ - Device settings tests need to be implemented
    // These tests require proper mocking of device settings management
    it.skip("should get device settings", async () => {
      await neurosity.login(credentials);
      const settings = await firstValueFrom(neurosity.settings());
      expect(settings).toBeDefined();
      expect(typeof settings.lsl).toBe("boolean");
    });

    it.skip("should update device settings", async () => {
      await neurosity.login(credentials);
      const newSettings: Settings = {
        lsl: true,
        supportAccess: false,
        activityLogging: false
      };
      await expect(
        neurosity.changeSettings(newSettings)
      ).resolves.not.toThrow();

      const settings = await firstValueFrom(neurosity.settings());
      expect(settings.lsl).toBe(newSettings.lsl);
    });
  });

  describe("Error Handling", () => {
    // TODO: Issue #XYZ - Error handling tests need to be implemented
    // These tests require proper error simulation and handling
    it.skip("should handle unauthorized access", async () => {
      // Try to access device info without login
      await expect(firstValueFrom(neurosity.getInfo())).rejects.toThrow();
    });

    it.skip("should handle device offline state", async () => {
      await neurosity.login(credentials);
      // Mock device going offline
      await expect(firstValueFrom(neurosity.status())).resolves.toMatchObject({
        state: "offline"
      });
    });
  });
});
