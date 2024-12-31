import { Neurosity } from "../Neurosity";
import { firstValueFrom, of, ReplaySubject } from "rxjs";
import { DeviceInfo } from "../types/deviceInfo";
import { STATUS } from "../types/status";
import { DeviceStatus } from "../types/status";
import {
  strongClick100,
  strongBuzz100,
  alert750ms,
  doubleClick100,
  sharpClick100
} from "../utils/hapticEffects";
import { MODEL_VERSION_2, HAPTIC_P7, HAPTIC_P8 } from "../utils/platform";

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
    private _deviceInfo: DeviceInfo = {
      deviceId: "test-device-id",
      deviceNickname: "Test Device",
      channelNames: ["CH1", "CH2"],
      channels: 2,
      samplingRate: 250,
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

    selectDevice = jest
      .fn()
      .mockImplementation(
        async (selector: (devices: DeviceInfo[]) => DeviceInfo) => {
          const selectedDevice = selector([this._deviceInfo]);
          this._selectedDevice.next(selectedDevice);
          return selectedDevice;
        }
      );

    getSelectedDevice = jest.fn().mockResolvedValue(this._deviceInfo);

    didSelectDevice = jest.fn().mockResolvedValue(true);

    onDeviceChange = jest.fn().mockReturnValue(
      of({
        state: STATUS.ONLINE,
        charging: false,
        battery: 100,
        sleepMode: false,
        updatingProgress: 0,
        bluetoothEnabled: false,
        sleepModeReason: null,
        lastHeartbeat: Date.now(),
        ssid: "test-network"
      } as DeviceStatus)
    );

    osVersion = jest.fn().mockReturnValue(of("1.0.0"));

    status = jest.fn().mockReturnValue(
      of({
        state: STATUS.ONLINE,
        charging: false,
        battery: 100,
        sleepMode: false,
        updatingProgress: 0,
        bluetoothEnabled: false,
        sleepModeReason: null,
        lastHeartbeat: Date.now(),
        ssid: "test-network"
      } as DeviceStatus)
    );

    dispatchAction = jest.fn().mockImplementation(async (payload: any) => {
      const { effects } = payload.message;
      for (const location of Object.keys(effects)) {
        if (![HAPTIC_P7, HAPTIC_P8].includes(location)) {
          throw new Error(`Invalid haptic location: ${location}`);
        }
        const effectList = effects[location];
        if (!Array.isArray(effectList)) {
          throw new Error("Effects must be an array");
        }
        if (effectList.length > 7) {
          throw new Error("Maximum items in array is 7");
        }
        for (const effect of effectList) {
          const validEffects = [
            strongClick100,
            strongBuzz100,
            alert750ms,
            doubleClick100,
            sharpClick100
          ];
          if (!validEffects.includes(effect)) {
            throw new Error("Invalid haptic effect");
          }
        }
      }
      return Promise.resolve();
    });
  }

  return {
    ...originalModule,
    CloudClient: jest
      .fn()
      .mockImplementation((options) => new MockCloudClient(options))
  };
});

describe("Haptics", () => {
  let neurosity: Neurosity;
  const testDeviceId = "test-device-id";

  beforeEach(() => {
    neurosity = new Neurosity({
      deviceId: testDeviceId,
      emulator: true
    });
  });

  describe("Haptic Effects", () => {
    it("should trigger strong click haptic effect on P7", async () => {
      await expect(
        neurosity.haptics({
          [HAPTIC_P7]: [strongClick100]
        })
      ).resolves.not.toThrow();
    });

    it("should trigger strong buzz haptic effect on P8", async () => {
      await expect(
        neurosity.haptics({
          [HAPTIC_P8]: [strongBuzz100]
        })
      ).resolves.not.toThrow();
    });

    it("should trigger effects on both motors", async () => {
      await expect(
        neurosity.haptics({
          [HAPTIC_P7]: [alert750ms],
          [HAPTIC_P8]: [doubleClick100]
        })
      ).resolves.not.toThrow();
    });

    it("should trigger multiple effects on one motor", async () => {
      await expect(
        neurosity.haptics({
          [HAPTIC_P7]: [sharpClick100, strongClick100, doubleClick100]
        })
      ).resolves.not.toThrow();
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid haptic location", async () => {
      await expect(
        neurosity.haptics({
          invalid: [strongClick100]
        })
      ).rejects.toThrow(/location not supported/);
    });

    it("should handle invalid haptic effect", async () => {
      await expect(
        neurosity.haptics({
          [HAPTIC_P7]: ["invalid"]
        })
      ).rejects.toThrow("Invalid haptic effect");
    });

    it("should handle too many effects", async () => {
      await expect(
        neurosity.haptics({
          [HAPTIC_P7]: Array(8).fill(strongClick100)
        })
      ).rejects.toThrow(/Maximum items in array is 7/);
    });
  });
});
