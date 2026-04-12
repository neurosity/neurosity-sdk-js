import { Neurosity } from "../Neurosity";
import { of, ReplaySubject } from "rxjs";
import { DeviceInfo } from "../types/deviceInfo";
import { STATUS, DeviceStatus } from "../types/status";
import { MODEL_VERSION_2 } from "../utils/platform";

jest.mock("../api", () => {
  const originalModule = jest.requireActual("../api");

  class MockCloudClient {
    public user = null;
    public userClaims = { scopes: ["brainwaves"] };
    protected options: any;
    public subscriptionManager = {
      add: jest.fn(),
      remove: jest.fn(),
      removeAll: jest.fn()
    };
    private _selectedDevice = new ReplaySubject<DeviceInfo | null | undefined>(
      1
    );
    private _deviceInfo: DeviceInfo = {
      deviceId: "test-device-id",
      deviceNickname: "Test Device",
      channelNames: ["CP3", "C3", "F5", "PO3", "PO4", "F6", "C4", "CP4"],
      channels: 8,
      samplingRate: 256,
      manufacturer: "Neurosity",
      model: "Crown",
      modelName: "Crown",
      modelVersion: MODEL_VERSION_2,
      apiVersion: "1.0.0",
      osVersion: "1.0.0",
      emulator: false
    };

    constructor(options: any) {
      this.options = options;
      this._selectedDevice.next(this._deviceInfo);
    }

    getInfo = jest.fn().mockResolvedValue(this._deviceInfo);
    selectDevice = jest.fn();
    getSelectedDevice = jest.fn().mockResolvedValue(this._deviceInfo);
    didSelectDevice = jest.fn().mockResolvedValue(true);
    onDeviceChange = jest.fn().mockReturnValue(of({} as DeviceStatus));
    osVersion = jest.fn().mockReturnValue(of("17.0.0"));
    status = jest.fn().mockReturnValue(
      of({
        state: STATUS.ONLINE,
        charging: false,
        battery: 100,
        sleepMode: false,
        sleepModeReason: null,
        lastHeartbeat: Date.now(),
        ssid: "test-network"
      } as DeviceStatus)
    );

    dispatchAction = jest.fn().mockResolvedValue({
      message: { ok: true, id: "memory-123", cloudUpload: true }
    });
  }

  return {
    ...originalModule,
    CloudClient: jest
      .fn()
      .mockImplementation((options) => new MockCloudClient(options))
  };
});

describe("Recording", () => {
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

  describe("record()", () => {
    it("should record brainwaves with label and duration", async () => {
      const result = await neurosity.record({
        label: "eyes-closed",
        duration: 60000
      });

      expect(result.ok).toBe(true);
      expect(result.id).toBe("memory-123");
      expect(result.cloudUpload).toBe(true);

      expect(cloudClient.dispatchAction).toHaveBeenCalledWith(
        expect.objectContaining({
          command: "brainwaves",
          action: "record",
          message: expect.objectContaining({
            label: "eyes-closed",
            duration: 60000
          }),
          responseRequired: true
        })
      );
    });

    it("should pass all options to dispatchAction", async () => {
      await neurosity.record({
        name: "Morning session",
        label: "focus-training",
        duration: 120000,
        experimentId: "exp-001"
      });

      expect(cloudClient.dispatchAction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.objectContaining({
            name: "Morning session",
            label: "focus-training",
            duration: 120000,
            experimentId: "exp-001"
          })
        })
      );
    });

    it("should default name to label when not provided", async () => {
      await neurosity.record({
        label: "eyes-closed",
        duration: 60000
      });

      const call = cloudClient.dispatchAction.mock.calls[0][0];
      expect(call.message.name).toBe("eyes-closed");
    });

    it("should default experimentId to 'sdk-recording' when not provided", async () => {
      await neurosity.record({
        label: "eyes-closed",
        duration: 60000
      });

      const call = cloudClient.dispatchAction.mock.calls[0][0];
      expect(call.message.experimentId).toBe("sdk-recording");
    });

    it("should set responseTimeout to duration + 90s", async () => {
      await neurosity.record({
        label: "eyes-closed",
        duration: 60000
      });

      const call = cloudClient.dispatchAction.mock.calls[0][0];
      expect(call.responseTimeout).toBe(60000 + 90000);
    });
  });

  describe("Validation", () => {
    it("should reject when label is missing", async () => {
      await expect(
        neurosity.record({ label: "", duration: 60000 })
      ).rejects.toThrow(/label is required/);
    });

    it("should reject when duration is zero", async () => {
      await expect(
        neurosity.record({ label: "test", duration: 0 })
      ).rejects.toThrow(/positive duration is required/);
    });

    it("should reject when duration is negative", async () => {
      await expect(
        neurosity.record({ label: "test", duration: -1000 })
      ).rejects.toThrow(/positive duration is required/);
    });

    it("should reject when duration exceeds 30 minutes", async () => {
      await expect(
        neurosity.record({ label: "test", duration: 31 * 60 * 1000 })
      ).rejects.toThrow(/exceeds maximum/);
    });

    it("should accept exactly 30 minutes", async () => {
      await expect(
        neurosity.record({ label: "test", duration: 30 * 60 * 1000 })
      ).resolves.not.toThrow();
    });
  });

  describe("Error handling", () => {
    it("should handle device not selected", async () => {
      cloudClient.didSelectDevice.mockResolvedValue(false);

      await expect(
        neurosity.record({ label: "test", duration: 60000 })
      ).rejects.toThrow();
    });

    it("should handle dispatch failure", async () => {
      cloudClient.dispatchAction.mockRejectedValue(
        new Error("Device is charging")
      );

      await expect(
        neurosity.record({ label: "test", duration: 60000 })
      ).rejects.toThrow("Device is charging");
    });

    it("should handle upload failure gracefully", async () => {
      cloudClient.dispatchAction.mockResolvedValue({
        message: { ok: true, id: "memory-456", cloudUpload: false }
      });

      const result = await neurosity.record({
        label: "test",
        duration: 60000
      });

      expect(result.ok).toBe(true);
      expect(result.cloudUpload).toBe(false);
    });
  });
});
