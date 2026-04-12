import { Neurosity } from "../Neurosity";
import { of, ReplaySubject, firstValueFrom } from "rxjs";
import { take, toArray, bufferTime } from "rxjs/operators";
import { DeviceInfo } from "../types/deviceInfo";
import { STATUS, DeviceStatus } from "../types/status";
import { MODEL_VERSION_2 } from "../utils/platform";

jest.mock("../api", () => {
  const originalModule = jest.requireActual("../api");

  let dispatchHandler: (action: any) => Promise<any>;

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
      osVersion: "17.0.0",
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

    dispatchAction = jest.fn().mockImplementation(async (action: any) => {
      if (dispatchHandler) return dispatchHandler(action);
      return { message: { ok: true } };
    });
  }

  return {
    ...originalModule,
    CloudClient: jest
      .fn()
      .mockImplementation((options) => new MockCloudClient(options)),
    __setDispatchHandler: (handler: any) => {
      dispatchHandler = handler;
    }
  };
});

const { __setDispatchHandler } = jest.requireMock("../api") as any;

describe("startRecording", () => {
  let neurosity: Neurosity;
  let cloudClient: any;

  beforeEach(() => {
    jest.useFakeTimers();
    neurosity = new Neurosity({
      deviceId: "test-device-id",
      emulator: true
    });
    cloudClient = (neurosity as any).cloudClient;
  });

  afterEach(() => {
    jest.useRealTimers();
    __setDispatchHandler(null);
  });

  describe("returns a RecordingHandle", () => {
    it("should return an object with stop, cancel, and result", async () => {
      __setDispatchHandler(async (action: any) => {
        if (action.action === "startRecording") {
          return {
            message: {
              ok: true,
              cancel: {
                command: "brainwaves",
                action: "cancelRecording",
                message: { pin: 123456 },
                responseRequired: true,
                responseTimeout: 70000
              },
              complete: {
                command: "brainwaves",
                action: "completeRecording",
                message: { pin: 123456 },
                responseRequired: true,
                responseTimeout: 70000
              }
            }
          };
        }
        return { message: { ok: true, id: "memory-123" } };
      });

      const handle = await neurosity.startRecording({
        label: "eyes-closed",
        maxDuration: 60000
      });

      expect(handle).toBeDefined();
      expect(typeof handle.stop).toBe("function");
      expect(typeof handle.cancel).toBe("function");
      expect(handle.result).toBeInstanceOf(Promise);
      expect(handle.elapsed$).toBeDefined();
    });
  });

  describe("elapsed$", () => {
    it("should emit elapsed milliseconds while recording", async () => {
      __setDispatchHandler(async (action: any) => {
        if (action.action === "startRecording") {
          return {
            message: {
              ok: true,
              cancel: {
                command: "brainwaves",
                action: "cancelRecording",
                message: { pin: 123456 },
                responseRequired: true,
                responseTimeout: 70000
              },
              complete: {
                command: "brainwaves",
                action: "completeRecording",
                message: { pin: 123456 },
                responseRequired: true,
                responseTimeout: 70000
              }
            }
          };
        }
        return { message: { ok: true, id: "memory-123" } };
      });

      const handle = await neurosity.startRecording({
        label: "test",
        maxDuration: 60000
      });

      const values: number[] = [];
      const sub = handle.elapsed$.subscribe((ms) => values.push(ms));

      await jest.advanceTimersByTimeAsync(3000);

      expect(values.length).toBeGreaterThanOrEqual(2);
      expect(values[0]).toBeGreaterThan(0);
      // Values should be increasing
      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeGreaterThan(values[i - 1]);
      }

      sub.unsubscribe();
      handle.cancel();
    });
  });

  describe("stop()", () => {
    it("should dispatch completeRecording action with pin", async () => {
      __setDispatchHandler(async (action: any) => {
        if (action.action === "startRecording") {
          return {
            message: {
              ok: true,
              cancel: {
                command: "brainwaves",
                action: "cancelRecording",
                message: { pin: 654321 },
                responseRequired: true,
                responseTimeout: 70000
              },
              complete: {
                command: "brainwaves",
                action: "completeRecording",
                message: { pin: 654321 },
                responseRequired: true,
                responseTimeout: 70000
              }
            }
          };
        }
        return { message: { ok: true, id: "memory-456" } };
      });

      const handle = await neurosity.startRecording({
        label: "test",
        maxDuration: 60000
      });

      const result = await handle.stop();

      expect(cloudClient.dispatchAction).toHaveBeenCalledWith(
        expect.objectContaining({
          command: "brainwaves",
          action: "completeRecording",
          message: { pin: 654321 }
        })
      );
      expect(result.ok).toBe(true);
      expect(result.id).toBe("memory-456");
    });
  });

  describe("cancel()", () => {
    it("should dispatch cancelRecording action with pin", async () => {
      __setDispatchHandler(async (action: any) => {
        if (action.action === "startRecording") {
          return {
            message: {
              ok: true,
              cancel: {
                command: "brainwaves",
                action: "cancelRecording",
                message: { pin: 111222 },
                responseRequired: true,
                responseTimeout: 70000
              },
              complete: {
                command: "brainwaves",
                action: "completeRecording",
                message: { pin: 111222 },
                responseRequired: true,
                responseTimeout: 70000
              }
            }
          };
        }
        return { message: { ok: true } };
      });

      const handle = await neurosity.startRecording({
        label: "test",
        maxDuration: 60000
      });

      await handle.cancel();

      expect(cloudClient.dispatchAction).toHaveBeenCalledWith(
        expect.objectContaining({
          command: "brainwaves",
          action: "cancelRecording",
          message: { pin: 111222 }
        })
      );
    });

    it("should complete elapsed$ observable on cancel", async () => {
      __setDispatchHandler(async (action: any) => {
        if (action.action === "startRecording") {
          return {
            message: {
              ok: true,
              cancel: {
                command: "brainwaves",
                action: "cancelRecording",
                message: { pin: 999999 },
                responseRequired: true,
                responseTimeout: 70000
              },
              complete: {
                command: "brainwaves",
                action: "completeRecording",
                message: { pin: 999999 },
                responseRequired: true,
                responseTimeout: 70000
              }
            }
          };
        }
        return { message: { ok: true } };
      });

      const handle = await neurosity.startRecording({
        label: "test",
        maxDuration: 60000
      });

      let completed = false;
      handle.elapsed$.subscribe({ complete: () => (completed = true) });

      await handle.cancel();

      expect(completed).toBe(true);
    });
  });

  describe("result", () => {
    it("should resolve with RecordingResult when stopped", async () => {
      __setDispatchHandler(async (action: any) => {
        if (action.action === "startRecording") {
          return {
            message: {
              ok: true,
              cancel: {
                command: "brainwaves",
                action: "cancelRecording",
                message: { pin: 123456 },
                responseRequired: true,
                responseTimeout: 70000
              },
              complete: {
                command: "brainwaves",
                action: "completeRecording",
                message: { pin: 123456 },
                responseRequired: true,
                responseTimeout: 70000
              }
            }
          };
        }
        return { message: { ok: true, id: "memory-789", cloudUpload: true } };
      });

      const handle = await neurosity.startRecording({
        label: "test",
        maxDuration: 60000
      });

      // Stop the recording
      handle.stop();

      const result = await handle.result;
      expect(result.ok).toBe(true);
      expect(result.id).toBe("memory-789");
      expect(result.cloudUpload).toBe(true);
    });
  });

  describe("validation", () => {
    it("should reject when label is missing", async () => {
      await expect(
        neurosity.startRecording({ label: "", maxDuration: 60000 })
      ).rejects.toThrow(/label is required/);
    });

    it("should reject when maxDuration is missing", async () => {
      await expect(
        neurosity.startRecording({ label: "test", maxDuration: 0 })
      ).rejects.toThrow(/positive maxDuration is required/);
    });

    it("should reject when maxDuration exceeds 30 minutes", async () => {
      await expect(
        neurosity.startRecording({
          label: "test",
          maxDuration: 31 * 60 * 1000
        })
      ).rejects.toThrow(/exceeds maximum/);
    });
  });
});
